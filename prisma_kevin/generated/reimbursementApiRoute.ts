import { NextRequest, NextResponse } from 'next/server';
import { ReimbursementOptionalDefaultsSchema, ReimbursementPartialSchema } from '@db/prisma/zod';
import { prisma } from '@db/prisma';

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (id) {
      const reimbursement = await prisma.reimbursement.findUnique({ where: { id } });
      return NextResponse.json({ data: reimbursement }, { status: 200 });
    }

    const reimbursements = await prisma.reimbursement.findMany();
    return NextResponse.json({ data: reimbursements }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const res = await request.json();

  try {
    const validatedData = ReimbursementOptionalDefaultsSchema.parse(res);
    const createdReimbursement = await prisma.reimbursement.create({
      data: validatedData,
    });
    return NextResponse.json({ data: createdReimbursement }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const res = await request.json();
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'No id provided' }, { status: 400 });

  try {
    const validatedData = ReimbursementPartialSchema.parse(res);
    if (Object.keys(validatedData).length === 0) return NextResponse.json({ error: 'No valid data provided' }, { status: 400 });

    const updatedReimbursement = await prisma.reimbursement.update({
      where: { id },
      data: validatedData,
    });
    return NextResponse.json({ data: updatedReimbursement }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'No id provided' }, { status: 400 });

  try {
    const deletedReimbursement = await prisma.reimbursement.delete({ where: { id } });
    return NextResponse.json({ data: deletedReimbursement }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
