import { CaseOptionalDefaultsSchema, CasePartialSchema } from '@db/prisma/zod'
import { NextRequest, NextResponse } from 'next/server'

import { getSearchSchema } from '@common/validations/base-search'
import { prisma } from '@db/prisma'

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

export async function GET(request: NextRequest) {
  const params = Object.fromEntries([...request.nextUrl.searchParams])
  const id = request.nextUrl.searchParams.get('id')

  try {
    if (id) {
      const data = await prisma.case.findUnique({
        where: { id },
        // include fields that referenced another table
        include: {
          assignedTo: true,
          category: true,
          division: true,
          nature: true,
          lastAction: {
            include: {
              action: true,
            },
          },
        },
      })
      return NextResponse.json({ data }, { status: 200 })
    }

    const { page, per_page, sort, operator } = getSearchSchema.parse(params)
    const offset = (page - 1) * per_page
    const [data, count] = await prisma.$transaction([
      prisma.case.findMany({
        where: {
          isDeleted: false,
        },
        // include fields that referenced another table
        include: {
          assignedTo: true,
          status: true,
          category: true,
          division: true,
          nature: true,
          priority: true,
          lastAction: {
            include: {
              action: true,
            },
          },
        },
        take: per_page,
        skip: offset,
      }),
      prisma.case.count({
        where: {},
      }),
    ])
    const pageCount = Math.ceil(count / per_page)
    return NextResponse.json({ data, pageCount }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
