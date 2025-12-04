'use client';

import { createClient } from '@/lib/supabase/client';

export interface EmployeeHierarchy {
  level: number;
  position: string;
  employees: any[];
}

export interface PositionLevel {
  level: number;
  title: string;
  priority: number;
}

export type PositionType = 'leadership' | 'management' | 'specialist' | 'staff';

/**
 * Group employees by organizational hierarchy
 */
export const groupEmployeesByHierarchy = (employees: any[]): EmployeeHierarchy[] => {
  // Define position hierarchy levels
  const hierarchyMap: { [key: string]: number } = {
    'Direktur': 1,
    'Koordinator': 2,
    'Kepala Sub Bagian': 3,
    'Analis Kebijakan': 4,
    'Perancang Peraturan Perundang-undangan': 4,
    'Pranata Hukum': 5
  };

  // Group by hierarchy level
  const grouped = employees.reduce((acc, employee) => {
    const level = hierarchyMap[employee.jabatan] || 6;
    const key = `level_${level}`;
    
    if (!acc[key]) {
      acc[key] = {
        level,
        position: employee.jabatan,
        employees: []
      };
    }
    
    acc[key].employees.push(employee);
    return acc;
  }, {} as { [key: string]: EmployeeHierarchy });

  // Sort by hierarchy level and return as array
  return Object.values(grouped).sort((a, b) => a.level - b.level);
};

/**
 * Get position level information
 */
export const getPositionLevel = (position: string): PositionLevel => {
  const levels: { [key: string]: PositionLevel } = {
    'Direktur': { level: 1, title: 'Executive', priority: 10 },
    'Koordinator': { level: 2, title: 'Senior Management', priority: 8 },
    'Kepala Sub Bagian': { level: 3, title: 'Middle Management', priority: 6 },
    'Analis Kebijakan': { level: 4, title: 'Senior Specialist', priority: 5 },
    'Perancang Peraturan Perundang-undangan': { level: 4, title: 'Senior Specialist', priority: 5 },
    'Pranata Hukum': { level: 5, title: 'Specialist', priority: 4 }
  };

  return levels[position] || { level: 6, title: 'Staff', priority: 1 };
};

/**
 * Detect position type based on role and responsibilities
 */
export const detectPositionType = (position: string, fungsi?: string): PositionType => {
  const leadershipPositions = ['Direktur'];
  const managementPositions = ['Koordinator', 'Kepala Sub Bagian'];
  const specialistPositions = ['Analis Kebijakan', 'Perancang Peraturan Perundang-undangan'];
  
  if (leadershipPositions.includes(position)) {
    return 'leadership';
  }
  
  if (managementPositions.includes(position)) {
    return 'management';
  }
  
  if (specialistPositions.includes(position)) {
    return 'specialist';
  }
  
  return 'staff';
};

/**
 * Calculate workload capacity based on position
 */
export const calculateWorkloadCapacity = (position: string, fungsi: string): number => {
  const baseCapacity: { [key: string]: number } = {
    'Direktur': 20,
    'Koordinator': 15,
    'Kepala Sub Bagian': 12,
    'Analis Kebijakan': 10,
    'Perancang Peraturan Perundang-undangan': 10,
    'Pranata Hukum': 8
  };

  const fungsiMultiplier: { [key: string]: number } = {
    'SOSTERASI': 1.2,
    'PENISETAN': 1.1,
    'HPIKSP': 1.0,
    'BUTEK': 0.9,
    'NON FUNGSI': 0.8
  };

  const base = baseCapacity[position] || 6;
  const multiplier = fungsiMultiplier[fungsi] || 1.0;
  
  return Math.round(base * multiplier);
};

/**
 * Get employee performance metrics
 */
export const getEmployeePerformanceMetrics = async (employeeId: string) => {
  const supabase = createClient();
  
  try {
    // Get workload completion stats
    const { data: workloadStats, error: workloadError } = await supabase
      .from('workload')
      .select('status, created_at, tgl_deadline')
      .eq('employee_id', employeeId);

    if (workloadError) throw workloadError;

    const totalWorkload = workloadStats?.length || 0;
    const completedWorkload = workloadStats?.filter(w => w.status === 'done').length || 0;
    const pendingWorkload = workloadStats?.filter(w => w.status === 'pending').length || 0;
    const inProgressWorkload = workloadStats?.filter(w => w.status === 'on-progress').length || 0;

    // Calculate completion rate
    const completionRate = totalWorkload > 0 ? (completedWorkload / totalWorkload) * 100 : 0;

    // Calculate average completion time
    const completedTasks = workloadStats?.filter(w => w.status === 'done') || [];
    const avgCompletionTime = completedTasks.length > 0 
      ? completedTasks.reduce((acc, task) => {
          const start = new Date(task.created_at);
          const end = new Date(task.tgl_deadline);
          return acc + (end.getTime() - start.getTime());
        }, 0) / completedTasks.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    return {
      totalWorkload,
      completedWorkload,
      pendingWorkload,
      inProgressWorkload,
      completionRate: Math.round(completionRate),
      avgCompletionTime: Math.round(avgCompletionTime),
      productivity: calculateProductivityScore(completionRate, avgCompletionTime)
    };
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    throw error;
  }
};

/**
 * Calculate productivity score
 */
const calculateProductivityScore = (completionRate: number, avgCompletionTime: number): number => {
  // Weighted score: 70% completion rate, 30% speed (inverse of avg time)
  const completionScore = completionRate;
  const speedScore = avgCompletionTime > 0 ? Math.max(0, 100 - avgCompletionTime * 2) : 50;
  
  return Math.round(completionScore * 0.7 + speedScore * 0.3);
};

/**
 * Get team collaboration metrics
 */
export const getTeamCollaborationMetrics = async (employeeId: string) => {
  const supabase = createClient();
  
  try {
    // Get workload where employee is involved (directly or as collaborator)
    const { data: collaborativeWork, error } = await supabase
      .from('workload')
      .select('*')
      .or(`employee_id.eq.${employeeId},created_by.eq.${employeeId}`);

    if (error) throw error;

    const directAssignments = collaborativeWork?.filter(w => w.employee_id === employeeId).length || 0;
    const createdForOthers = collaborativeWork?.filter(w => w.created_by === employeeId && w.employee_id !== employeeId).length || 0;

    return {
      directAssignments,
      createdForOthers,
      collaborationScore: calculateCollaborationScore(directAssignments, createdForOthers)
    };
  } catch (error) {
    console.error('Error fetching collaboration metrics:', error);
    throw error;
  }
};

const calculateCollaborationScore = (direct: number, created: number): number => {
  const total = direct + created;
  if (total === 0) return 0;
  
  // Higher score for balanced collaboration (both receiving and delegating work)
  const balance = Math.min(direct, created) / Math.max(direct, created);
  return Math.round(balance * 100);
};

/**
 * Get employee workload trends
 */
export const getWorkloadTrends = async (employeeId: string, months: number = 6) => {
  const supabase = createClient();
  
  try {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const { data: trendData, error } = await supabase
      .from('workload')
      .select('created_at, status, tgl_deadline')
      .eq('employee_id', employeeId)
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    // Group by month
    const monthlyData = trendData?.reduce((acc, item) => {
      const month = new Date(item.created_at).toISOString().substring(0, 7); // YYYY-MM
      
      if (!acc[month]) {
        acc[month] = { total: 0, completed: 0, pending: 0, inProgress: 0 };
      }
      
      acc[month].total++;
      
      switch (item.status) {
        case 'done':
          acc[month].completed++;
          break;
        case 'pending':
          acc[month].pending++;
          break;
        case 'on-progress':
          acc[month].inProgress++;
          break;
      }
      
      return acc;
    }, {} as { [key: string]: any }) || {};

    return Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  } catch (error) {
    console.error('Error fetching workload trends:', error);
    throw error;
  }
};

/**
 * Smart employee recommendations for workload assignment
 */
export const getSmartAssignmentRecommendations = async (
  workloadType: string,
  fungsi: string,
  complexity: 'low' | 'medium' | 'high' = 'medium'
) => {
  const supabase = createClient();
  
  try {
    // Get all users with their current workload
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'user');

    if (usersError) throw usersError;

    const recommendations = await Promise.all(
      users?.map(async (user) => {
        const metrics = await getEmployeePerformanceMetrics(user.id);
        const capacity = calculateWorkloadCapacity(user.jabatan, user.fungsi);
        const currentLoad = metrics.totalWorkload - metrics.completedWorkload;
        const utilization = (currentLoad / capacity) * 100;
        
        // Calculate compatibility score
        const fungsiMatch = user.fungsi === fungsi ? 20 : 0;
        const capacityScore = Math.max(0, 30 - utilization); // Higher score for lower utilization
        const performanceScore = metrics.productivity * 0.5;
        
        const totalScore = fungsiMatch + capacityScore + performanceScore;
        
        return {
          employee: user,
          score: Math.round(totalScore),
          currentUtilization: Math.round(utilization),
          capacity,
          currentLoad,
          metrics,
          recommendation: getRecommendationLevel(totalScore, utilization)
        };
      }) || []
    );

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5 recommendations
  } catch (error) {
    console.error('Error getting assignment recommendations:', error);
    throw error;
  }
};

const getRecommendationLevel = (score: number, utilization: number): 'excellent' | 'good' | 'fair' | 'poor' => {
  if (score >= 80 && utilization < 70) return 'excellent';
  if (score >= 60 && utilization < 85) return 'good';
  if (score >= 40 && utilization < 95) return 'fair';
  return 'poor';
};

/**
 * Delete employee with proper cleanup
 */
export const deleteEmployee = async (employeeId: string): Promise<{ success: boolean; message: string }> => {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', employeeId);

    if (error) throw error;

    return { success: true, message: 'Employee deleted successfully' };
  } catch (error) {
    console.error('Error deleting employee:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to delete employee' 
    };
  }
};