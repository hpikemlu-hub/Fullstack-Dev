# 🔧 Workload System Technical Implementation Guide

## 📋 Overview

This technical guide provides detailed implementation instructions for building the Workload System on top of the existing Employee Management foundation. It includes specific code examples, database migrations, API implementations, and component architectures.

## 🗄️ Database Schema Enhancements

### Enhanced Workload Schema
```sql
-- Add advanced fields to existing workload table
ALTER TABLE workload ADD COLUMN IF NOT EXISTS dependencies TEXT; -- JSON array
ALTER TABLE workload ADD COLUMN IF NOT EXISTS tags TEXT; -- JSON array  
ALTER TABLE workload ADD COLUMN IF NOT EXISTS complexity_score INTEGER DEFAULT 1;
ALTER TABLE workload ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;
ALTER TABLE workload ADD COLUMN IF NOT EXISTS attachment_urls TEXT; -- JSON array

-- Create workload assignments table
CREATE TABLE workload_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workload_id UUID REFERENCES workload(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    role TEXT DEFAULT 'assignee' CHECK (role IN ('assignee', 'collaborator', 'reviewer')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workload_id, assigned_to, role)
);

-- Create time tracking table
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workload_id UUID REFERENCES workload(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    description TEXT,
    hours_spent DECIMAL(5,2) NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workload comments table
CREATE TABLE workload_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workload_id UUID REFERENCES workload(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_workload_assignments_workload ON workload_assignments(workload_id);
CREATE INDEX idx_workload_assignments_user ON workload_assignments(assigned_to);
CREATE INDEX idx_time_entries_workload ON time_entries(workload_id);
CREATE INDEX idx_time_entries_user ON time_entries(user_id);
CREATE INDEX idx_workload_comments_workload ON workload_comments(workload_id);
```

### Advanced Analytics Views
```sql
-- Workload analytics materialized view
CREATE MATERIALIZED VIEW workload_analytics AS
SELECT 
    DATE_TRUNC('week', w.created_at) as week,
    w.status,
    w.type,
    w.fungsi,
    w.priority,
    COUNT(*) as total_count,
    AVG(w.estimated_hours) as avg_estimated_hours,
    AVG(te.total_hours) as avg_actual_hours,
    COUNT(CASE WHEN w.tgl_deadline < CURRENT_DATE AND w.status != 'DONE' THEN 1 END) as overdue_count
FROM workload w
LEFT JOIN (
    SELECT workload_id, SUM(hours_spent) as total_hours
    FROM time_entries 
    GROUP BY workload_id
) te ON w.id = te.workload_id
GROUP BY 1, 2, 3, 4, 5;

-- User performance view
CREATE VIEW user_performance AS
SELECT 
    u.id as user_id,
    u.nama_lengkap,
    COUNT(w.id) as total_workloads,
    COUNT(CASE WHEN w.status = 'DONE' THEN 1 END) as completed_workloads,
    AVG(te.hours_spent) as avg_hours_per_task,
    COUNT(CASE WHEN w.tgl_deadline < w.updated_at AND w.status = 'DONE' THEN 1 END) as on_time_completions
FROM users u
LEFT JOIN workload w ON u.id = w.user_id
LEFT JOIN time_entries te ON w.id = te.workload_id
GROUP BY u.id, u.nama_lengkap;
```

## 🔌 Enhanced API Implementation

### Workload Service Layer
```typescript
// services/workloadService.ts
import { PrismaClient } from '@prisma/client';
import { WorkloadInput, WorkloadFilters, BulkAssignmentRequest } from '@/types';

export class WorkloadService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // Enhanced get workloads with advanced filtering
  async getWorkloads(filters: WorkloadFilters = {}, userId?: string) {
    const {
      status,
      priority,
      fungsi,
      assignedTo,
      dateRange,
      search,
      page = 1,
      limit = 50,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = filters;

    const where: any = {};

    // Apply filters
    if (status?.length) where.status = { in: status };
    if (priority?.length) where.priority = { in: priority };
    if (fungsi?.length) where.fungsi = { in: fungsi };
    if (assignedTo) where.user_id = assignedTo;
    
    if (dateRange) {
      where.created_at = {
        gte: dateRange.start,
        lte: dateRange.end
      };
    }

    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { deskripsi: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [workloads, total] = await Promise.all([
      this.prisma.workload.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              namaLengkap: true,
              username: true
            }
          },
          assignments: {
            include: {
              assignedToUser: {
                select: {
                  id: true,
                  namaLengkap: true
                }
              }
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.workload.count({ where })
    ]);

    return {
      data: workloads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Bulk operations
  async bulkAssign(request: BulkAssignmentRequest, assignedBy: string) {
    const { workloadIds, assignedTo, role = 'assignee' } = request;

    return await this.prisma.$transaction(async (tx) => {
      // Remove existing assignments of the same role
      await tx.workloadAssignments.deleteMany({
        where: {
          workload_id: { in: workloadIds },
          role
        }
      });

      // Create new assignments
      const assignments = workloadIds.map(workloadId => ({
        workload_id: workloadId,
        assigned_to: assignedTo,
        assigned_by: assignedBy,
        role
      }));

      return await tx.workloadAssignments.createMany({
        data: assignments
      });
    });
  }

  // Smart assignment recommendations
  async getAssignmentRecommendations(workloadId: string) {
    const workload = await this.prisma.workload.findUnique({
      where: { id: workloadId }
    });

    if (!workload) throw new Error('Workload not found');

    // Get users with similar workload types and good performance
    const recommendations = await this.prisma.$queryRaw`
      SELECT 
        u.id,
        u.nama_lengkap,
        COUNT(w.id) as experience_count,
        AVG(CASE WHEN w.status = 'DONE' THEN 1.0 ELSE 0.0 END) as completion_rate,
        COUNT(CASE WHEN w.status IN ('PENDING', 'ON_PROGRESS') THEN 1 END) as current_load
      FROM users u
      LEFT JOIN workload w ON u.id = w.user_id AND w.type = ${workload.type}
      WHERE u.is_active = true
      GROUP BY u.id, u.nama_lengkap
      HAVING COUNT(CASE WHEN w.status IN ('PENDING', 'ON_PROGRESS') THEN 1 END) < 5
      ORDER BY completion_rate DESC, experience_count DESC, current_load ASC
      LIMIT 5
    `;

    return recommendations;
  }

  // Analytics methods
  async getWorkloadAnalytics(filters: AnalyticsFilters) {
    // Implementation for analytics data
    const stats = await this.prisma.$queryRaw`
      SELECT 
        status,
        COUNT(*) as count,
        AVG(estimated_hours) as avg_estimated,
        AVG(actual_hours) as avg_actual
      FROM workload_analytics 
      WHERE week >= ${filters.startDate} AND week <= ${filters.endDate}
      GROUP BY status
    `;

    return this.formatAnalyticsData(stats);
  }

  private formatAnalyticsData(rawData: any[]) {
    // Format and transform analytics data
    return {
      statusDistribution: rawData,
      totalWorkloads: rawData.reduce((sum, item) => sum + item.count, 0),
      averageCompletionTime: this.calculateAverageCompletionTime(rawData)
    };
  }

  private calculateAverageCompletionTime(data: any[]) {
    // Calculate average completion time logic
    return 0; // Placeholder
  }
}
```

## 🎨 Component Architecture

### Enhanced Workload Form Component
```typescript
// components/workload/EnhancedWorkloadForm.tsx
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { DatePicker } from '@/components/ui/date-picker';
import { FileUpload } from '@/components/ui/file-upload';
import { UserSelector } from '@/components/employees/UserSelector';

const workloadSchema = z.object({
  nama: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  deskripsi: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  fungsi: z.string().optional(),
  estimatedHours: z.number().min(0.5, 'Must be at least 0.5 hours'),
  tglDeadline: z.date().optional(),
  assignedTo: z.string().optional(),
  collaborators: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
  attachments: z.array(z.any()).optional()
});

type WorkloadFormData = z.infer<typeof workloadSchema>;

interface EnhancedWorkloadFormProps {
  initialData?: Partial<WorkloadFormData>;
  onSubmit: (data: WorkloadFormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export function EnhancedWorkloadForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isEditing = false 
}: EnhancedWorkloadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  const form = useForm<WorkloadFormData>({
    resolver: zodResolver(workloadSchema),
    defaultValues: initialData
  });

  const handleSubmit = async (data: WorkloadFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({ ...data, attachments });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Edit Workload' : 'Create New Workload'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Task Name</label>
              <Input {...form.register('nama')} />
              {form.formState.errors.nama && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.nama.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select {...form.register('type')}>
                <option value="">Select type...</option>
                <option value="Meeting">Meeting</option>
                <option value="Documentation">Documentation</option>
                <option value="Development">Development</option>
                <option value="Review">Review</option>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select {...form.register('priority')}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estimated Hours</label>
              <Input 
                type="number" 
                step="0.5"
                {...form.register('estimatedHours', { valueAsNumber: true })} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Deadline</label>
              <DatePicker
                value={form.watch('tglDeadline')}
                onChange={(date) => form.setValue('tglDeadline', date)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Function</label>
              <Select {...form.register('fungsi')}>
                <option value="">Select function...</option>
                <option value="Hukum">Hukum</option>
                <option value="Perjanjian">Perjanjian</option>
                <option value="Sosial Budaya">Sosial Budaya</option>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea 
              {...form.register('deskripsi')}
              rows={4}
              placeholder="Describe the task in detail..."
            />
          </div>

          {/* Assignment Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign To</label>
              <UserSelector
                value={form.watch('assignedTo')}
                onChange={(userId) => form.setValue('assignedTo', userId)}
                placeholder="Select assignee..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Collaborators</label>
              <MultiSelect
                options={[]} // Load from users API
                value={form.watch('collaborators') || []}
                onChange={(values) => form.setValue('collaborators', values)}
                placeholder="Select collaborators..."
              />
            </div>
          </div>

          {/* Tags and Dependencies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <MultiSelect
                options={[
                  { value: 'urgent', label: 'Urgent' },
                  { value: 'meeting', label: 'Meeting' },
                  { value: 'documentation', label: 'Documentation' }
                ]}
                value={form.watch('tags') || []}
                onChange={(values) => form.setValue('tags', values)}
                placeholder="Add tags..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Dependencies</label>
              <MultiSelect
                options={[]} // Load from existing workloads
                value={form.watch('dependencies') || []}
                onChange={(values) => form.setValue('dependencies', values)}
                placeholder="Select dependent tasks..."
              />
            </div>
          </div>

          {/* File Attachments */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Attachments</label>
            <FileUpload
              files={attachments}
              onFilesChange={setAttachments}
              maxFiles={5}
              maxSize={10 * 1024 * 1024} // 10MB
              acceptedTypes={['pdf', 'doc', 'docx', 'jpg', 'png']}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```