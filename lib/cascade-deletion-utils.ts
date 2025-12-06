'use client';

import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types';

export interface DataImpact {
  workloadCount: number;
  calendarCount: number;
  totalImpact: number;
  relatedUsers: string[];
  criticalAssignments: any[];
}

export interface DeletionPrerequisites {
  canDelete: boolean;
  warnings: string[];
  requirements: string[];
  hasActiveWorkload: boolean;
  hasDependentUsers: boolean;
}

/**
 * Get comprehensive deletion impact analysis for an employee
 */
export const getEmployeeDeletionImpact = async (employeeId: string): Promise<DataImpact> => {
  const supabase = createClient();
  
  try {
    // Get workload count
    const { data: workload, error: workloadError } = await supabase
      .from('workload')
      .select('id')
      .eq('employee_id', employeeId);

    if (workloadError) {
      console.error('Error fetching workload:', workloadError);
      throw workloadError;
    }

    // Get related users (subordinates or team members)
    const { data: relatedUsers, error: usersError } = await supabase
      .from('users')
      .select('nama_lengkap')
      .eq('supervisor_id', employeeId);

    if (usersError) {
      console.error('Error fetching related users:', usersError);
      throw usersError;
    }

    // Get critical assignments (active workload)
    const { data: criticalAssignments, error: criticalError } = await supabase
      .from('workload')
      .select('*')
      .eq('employee_id', employeeId)
      .neq('status', 'done');

    if (criticalError) {
      console.error('Error fetching critical assignments:', criticalError);
      throw criticalError;
    }

    // Get calendar events count
    const { count: calendarCount, error: calendarError } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', employeeId);

    if (calendarError) {
      console.error('Error fetching calendar events:', calendarError);
      // Don't throw here, just continue with 0 count
    }

    const workloadCountNum = workload?.length || 0;
    const calendarCountNum = calendarCount || 0;

    return {
      workloadCount: workloadCountNum,
      calendarCount: calendarCountNum,
      totalImpact: workloadCountNum + calendarCountNum,
      relatedUsers: relatedUsers?.map(u => u.nama_lengkap) || [],
      criticalAssignments: criticalAssignments || []
    };
  } catch (error) {
    console.error('Error in getEmployeeDeletionImpact:', error);
    throw error;
  }
};

/**
 * Get potential transfer targets for employee's workload
 */
export const getTransferTargetEmployees = async (excludeId: string): Promise<User[]> => {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, nama_lengkap, nip, golongan, jabatan, username, role, is_active, email, created_at, updated_at')
      .neq('id', excludeId)
      .eq('role', 'user')
      .order('nama_lengkap');

    if (error) {
      console.error('Error fetching transfer targets:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getTransferTargetEmployees:', error);
    throw error;
  }
};

/**
 * Validate deletion prerequisites
 */
export const validateDeletionPrerequisites = async (employeeId: string): Promise<DeletionPrerequisites> => {
  try {
    const impact = await getEmployeeDeletionImpact(employeeId);
    
    const hasActiveWorkload = impact.criticalAssignments.length > 0;
    const hasDependentUsers = impact.relatedUsers.length > 0;
    
    const warnings: string[] = [];
    const requirements: string[] = [];
    
    if (hasActiveWorkload) {
      warnings.push(`Employee has ${impact.criticalAssignments.length} active workload assignments`);
      requirements.push('Transfer or complete all active workload before deletion');
    }
    
    if (hasDependentUsers) {
      warnings.push(`${impact.relatedUsers.length} users report to this employee`);
      requirements.push('Reassign subordinates to another supervisor');
    }
    
    if (impact.workloadCount > 0) {
      warnings.push(`Employee has ${impact.workloadCount} total workload records`);
    }

    const canDelete = !hasActiveWorkload && !hasDependentUsers;

    return {
      canDelete,
      warnings,
      requirements,
      hasActiveWorkload,
      hasDependentUsers
    };
  } catch (error) {
    console.error('Error in validateDeletionPrerequisites:', error);
    throw error;
  }
};

/**
 * Perform cascading deletion with data transfer
 */
export const performCascadeDeletion = async (
  employeeId: string, 
  transferTargetId?: string,
  options: {
    deleteWorkload: boolean;
    transferWorkload: boolean;
    reassignSubordinates: boolean;
    targetSupervisorId?: string;
  } = {
    deleteWorkload: false,
    transferWorkload: true,
    reassignSubordinates: true
  }
) => {
  const supabase = createClient();
  
  try {
    // Start a transaction-like process
    const operations = [];

    // 1. Handle workload
    if (options.deleteWorkload) {
      const { error: workloadError } = await supabase
        .from('workload')
        .delete()
        .eq('employee_id', employeeId);
      
      if (workloadError) throw workloadError;
      operations.push('Deleted workload records');
    } else if (options.transferWorkload && transferTargetId) {
      const { error: transferError } = await supabase
        .from('workload')
        .update({ employee_id: transferTargetId })
        .eq('employee_id', employeeId);
      
      if (transferError) throw transferError;
      operations.push('Transferred workload to new employee');
    }

    // 2. Handle subordinates
    if (options.reassignSubordinates && options.targetSupervisorId) {
      const { error: subordinatesError } = await supabase
        .from('users')
        .update({ supervisor_id: options.targetSupervisorId })
        .eq('supervisor_id', employeeId);
      
      if (subordinatesError) throw subordinatesError;
      operations.push('Reassigned subordinates');
    }

    // 3. Delete the employee
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', employeeId);
    
    if (deleteError) throw deleteError;
    operations.push('Deleted employee record');

    return {
      success: true,
      operations,
      message: 'Employee successfully deleted with data preservation'
    };
  } catch (error) {
    console.error('Error in performCascadeDeletion:', error);
    throw error;
  }
};

/**
 * Retry deletion with automatic conflict resolution
 */
export const retryDeletion = async (employeeId: string, autoResolve = false) => {
  try {
    const prerequisites = await validateDeletionPrerequisites(employeeId);
    
    if (prerequisites.canDelete) {
      return await performCascadeDeletion(employeeId);
    }
    
    if (autoResolve) {
      // Find suitable transfer targets
      const transferTargets = await getTransferTargetEmployees(employeeId);
      
      if (transferTargets.length === 0) {
        throw new Error('No suitable transfer targets found for auto-resolution');
      }
      
      // Use first available target
      const targetId = transferTargets[0].id;
      
      return await performCascadeDeletion(employeeId, targetId, {
        deleteWorkload: false,
        transferWorkload: true,
        reassignSubordinates: true,
        targetSupervisorId: targetId
      });
    }
    
    throw new Error('Manual resolution required before deletion');
  } catch (error) {
    console.error('Error in retryDeletion:', error);
    throw error;
  }
};

/**
 * Preview deletion impact without performing the deletion
 */
export const previewDeletionImpact = async (employeeId: string) => {
  try {
    const [impact, prerequisites, transferTargets] = await Promise.all([
      getEmployeeDeletionImpact(employeeId),
      validateDeletionPrerequisites(employeeId),
      getTransferTargetEmployees(employeeId)
    ]);
    
    return {
      impact,
      prerequisites,
      transferTargets,
      recommendations: {
        suggestedAction: prerequisites.canDelete ? 'safe_delete' : 'requires_cleanup',
        priority: prerequisites.hasActiveWorkload ? 'high' : 'medium',
        estimatedTime: calculateEstimatedResolutionTime(impact, prerequisites)
      }
    };
  } catch (error) {
    console.error('Error in previewDeletionImpact:', error);
    throw error;
  }
};

/**
 * Calculate estimated time for resolution
 */
const calculateEstimatedResolutionTime = (impact: DataImpact, prerequisites: DeletionPrerequisites): string => {
  let timeEstimate = '5 minutes';
  
  if (prerequisites.hasActiveWorkload) {
    timeEstimate = impact.criticalAssignments.length > 10 ? '30+ minutes' : '15 minutes';
  }
  
  if (prerequisites.hasDependentUsers) {
    timeEstimate = '20 minutes';
  }
  
  if (prerequisites.hasActiveWorkload && prerequisites.hasDependentUsers) {
    timeEstimate = '45+ minutes';
  }
  
  return timeEstimate;
};

/**
 * Bulk deletion with smart conflict resolution
 */
export const performBulkDeletion = async (
  employeeIds: string[],
  options: {
    autoResolveConflicts: boolean;
    defaultTransferTarget?: string;
  }
) => {
  const results = [];
  
  for (const employeeId of employeeIds) {
    try {
      const result = await retryDeletion(employeeId, options.autoResolveConflicts);
      results.push({ employeeId, success: true, result });
    } catch (error) {
      results.push({ 
        employeeId, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
  
  return results;
};

/**
 * Export deletion operations for audit
 */
export const exportDeletionAudit = async (employeeId: string) => {
  try {
    const preview = await previewDeletionImpact(employeeId);
    
    const auditData = {
      timestamp: new Date().toISOString(),
      employeeId,
      impact: preview.impact,
      prerequisites: preview.prerequisites,
      transferTargets: preview.transferTargets.map(t => ({
        id: t.id,
        name: t.nama_lengkap,
        position: t.jabatan
      })),
      recommendations: preview.recommendations,
      status: 'preview_generated'
    };
    
    // Convert to CSV or JSON for export
    return {
      data: auditData,
      csv: convertToCSV(auditData),
      json: JSON.stringify(auditData, null, 2)
    };
  } catch (error) {
    console.error('Error in exportDeletionAudit:', error);
    throw error;
  }
};

const convertToCSV = (data: any): string => {
  const headers = Object.keys(data).join(',');
  const values = Object.values(data).map(v => 
    typeof v === 'object' ? JSON.stringify(v) : v
  ).join(',');
  
  return `${headers}\n${values}`;
};