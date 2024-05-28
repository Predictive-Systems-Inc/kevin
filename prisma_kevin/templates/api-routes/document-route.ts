import {
  DocumentOptionalDefaultsSchema,
  DocumentPartialSchema,
} from '@db/prisma/zod'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@db/prisma'

export async function POST(request: NextRequest) {
  const res = await request.json()

  try {
    const validatedData = DocumentOptionalDefaultsSchema.parse(res)
    const createdDocument = await prisma.document.create({
      data: validatedData,
    })
    return NextResponse.json({ data: createdDocument }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const res = await request.json()

  try {
    const id = request.nextUrl.searchParams.get('id')
    if (!id)
      return NextResponse.json({ error: 'No id provided' }, { status: 400 })

    const validatedData = DocumentPartialSchema.parse(res)
    if (Object.keys(validatedData).length === 0)
      return NextResponse.json(
        { error: 'No valid data provided' },
        { status: 400 },
      )

    const updatedDocument = await prisma.document.update({
      where: { id },
      data: validatedData,
    })
    return NextResponse.json({ data: updatedDocument }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  if (!id)
    return NextResponse.json({ error: 'No id provided' }, { status: 400 })

  try {
    const deletedDocument = await prisma.document.delete({ where: { id } })
    return NextResponse.json({ data: deletedDocument }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
