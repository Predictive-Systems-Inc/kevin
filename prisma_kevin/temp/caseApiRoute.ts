import {
  CaseOptionalDefaultsSchema,
  CasePartialSchema,
} from '@db/prisma/zod'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@db/prisma'

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')
    if (id) {
      const caseData = await prisma.case.findUnique({ where: { id } })
      return NextResponse.json({ data: caseData }, { status: 200 })
    }

    const cases = await prisma.case.findMany()
    return NextResponse.json({ data: cases }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const res = await request.json()

  try {
    const validatedData = CaseOptionalDefaultsSchema.parse(res)
    const createdCase = await prisma.case.create({
      data: validatedData,
    })
    return NextResponse.json({ data: createdCase }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const res = await request.json()
  const id = request.nextUrl.searchParams.get('id')
  if (!id)
    return NextResponse.json({ error: 'No id provided' }, { status: 400 })

  try {
    const validatedData = CasePartialSchema.parse(res)
    if (Object.keys(validatedData).length === 0)
      return NextResponse.json(
        { error: 'No valid data provided' },
        { status: 400 },
      )

    const updatedCase = await prisma.case.update({
      where: { id },
      data: validatedData,
    })
    return NextResponse.json({ data: updatedCase }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  if (!id)
    return NextResponse.json({ error: 'No id provided' }, { status: 400 })

  try {
    const deletedCase = await prisma.case.delete({ where: { id } })
    return NextResponse.json({ data: deletedCase }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
