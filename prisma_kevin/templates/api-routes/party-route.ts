import { NextRequest, NextResponse } from 'next/server'
import { PartyOptionalDefaultsSchema, PartyPartialSchema } from '@db/prisma/zod'

import { prisma } from '@db/prisma'

export async function POST(request: NextRequest) {
  const res = await request.json()

  try {
    const validatedData = PartyOptionalDefaultsSchema.parse(res)
    const createdParty = await prisma.party.create({
      data: validatedData,
    })

    return NextResponse.json({ data: createdParty }, { status: 200 })
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
    const validatedData = PartyPartialSchema.parse(res)
    if (Object.keys(validatedData).length === 0)
      return NextResponse.json(
        { error: 'No valid data provided' },
        { status: 400 },
      )

    const updatedParty = await prisma.party.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json({ data: updatedParty }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  if (!id)
    return NextResponse.json({ error: 'No id provided' }, { status: 400 })

  try {
    const deletedParty = await prisma.party.delete({ where: { id } })
    return NextResponse.json({ data: deletedParty }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
