import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET() {
  try {
    const workloads = await prisma.workload.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            namaLengkap: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: workloads,
      count: workloads.length 
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}