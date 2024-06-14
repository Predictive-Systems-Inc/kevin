import {
  NatureOptionalDefaultsSchema,
  NaturePartialSchema,
} from '@db/prisma/zod'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@db/prisma'

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')
    if (id) {
      const nature = await prisma.nature.findUnique({ where: { id } })
      return NextResponse.json({ data: nature }, { status: 200 })
    }

    const nature = await prisma.nature.findMany()
    return NextResponse.json({ data: nature }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const res = await request.json()

  try {
    const validatedData = NatureOptionalDefaultsSchema.parse(res)
    const createdNature = await prisma.nature.create({
      data: validatedData,
    })
    return NextResponse.json({ data: createdNature }, { status: 200 })
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
    const validatedData = NaturePartialSchema.parse(res)
    if (Object.keys(validatedData).length === 0)
      return NextResponse.json(
        { error: 'No valid data provided' },
        { status: 400 },
      )

    const updatedNature = await prisma.nature.update({
      where: { id },
      data: validatedData,
    })
    return NextResponse.json({ data: updatedNature }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  if (!id)
    return NextResponse.json({ error: 'No id provided' }, { status: 400 })

  try {
    const deletedNature = await prisma.nature.delete({ where: { id } })
    return NextResponse.json({ data: deletedNature }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
