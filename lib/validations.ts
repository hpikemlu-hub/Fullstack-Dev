import { z } from 'zod';

// User validation schema
export const userSchema = z.object({
  nama_lengkap: z.string().min(1, 'Nama lengkap is required'),
  nip: z.string().optional(),
  golongan: z.string().optional(),
  jabatan: z.string().optional(),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email().optional().or(z.literal('')),
  role: z.enum(['admin', 'user']),
  is_active: z.boolean().optional().default(true)
});

// Extract the type from the schema
export type UserFormData = z.infer<typeof userSchema>;

// Workload validation schema
export const workloadSchema = z.object({
  nama: z.string().min(1, 'Nama workload is required'),
  type: z.string().min(1, 'Type is required'),
  deskripsi: z.string().optional(),
  status: z.enum(['done', 'on-progress', 'pending']),
  tgl_diterima: z.string().optional(),
  tgl_deadline: z.string().optional(),
  fungsi: z.string().optional(),
});

export type WorkloadFormData = z.infer<typeof workloadSchema>;

// Calendar event validation schema
export const calendarEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  event_type: z.string().optional(),
  is_business_trip: z.boolean().optional().default(false),
  is_all_day: z.boolean().optional().default(false),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  location: z.string().optional(),
  dipa: z.string().optional(),
  color: z.string().optional(),
  notes: z.string().optional(),
  budget_amount: z.number().optional(),
  budget_source: z.string().optional(),
});

export type CalendarEventFormData = z.infer<typeof calendarEventSchema>;

// Password change validation schema
export const passwordChangeSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

// Login validation schema
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;