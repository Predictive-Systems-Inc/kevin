import { NextRequest, NextResponse } from 'next/server'
import {
  ReimbursementOptionalDefaultsSchema,
  ReimbursementPartialSchema,
  ReimbursementSchema,
} from '@db/prisma/zod'
import { buildQueryCondition, splitString } from '@common/utils/get-table-data'

import { getReimbursementsSchema } from '@common/validations/reimbursement-search'
import { prisma } from '@db/prisma'

export async function GET(request: NextRequest) {
  const params = Object.fromEntries([...request.nextUrl.searchParams])
  const id = request.nextUrl.searchParams.get('id')

  try {
    if (id) {
      const data = await prisma.reimbursement.findUnique({
        where: { id },
        include: {
          case: true,
          user: true,
          expenseType: true,
        },
      })
      return NextResponse.json({ data }, { status: 200 })
    }

    const {
      page,
      per_page,
      sort,
      operator,
      description,
      amount,
      caseId,
      userId,
      expenseTypeId,
    } = getReimbursementsSchema.parse(params)

    const skip = (page - 1) * per_page
    const [column, order] = (sort?.split('.') as [
      string | undefined,
      'asc' | 'desc' | undefined,
    ]) ?? ['createdAt', 'desc']

    const [descriptionString, descriptionOp] = splitString(description)
    const [amountString, amountOp] = splitString(amount)
    const [caseIdString, caseIdOp] = splitString(caseId)
    const [userIdString, userIdOp] = splitString(userId)
    const [expenseTypeIdString, expenseTypeIdOp] = splitString(expenseTypeId)

    const noFilterGiven = !(
      description ||
      amount ||
      caseId ||
      userId ||
      expenseTypeId
    )

    const query = {
      ...buildQueryCondition({
        field: 'description',
        operation: descriptionOp,
        value: descriptionString[0],
      }),
      ...buildQueryCondition({
        field: 'amount',
        operation: amountOp,
        value: amountString[0],
      }),
      ...buildQueryCondition({
        field: 'caseId',
        operation: caseIdOp,
        value: caseIdString[0],
      }),
      ...buildQueryCondition({
        field: 'userId',
        operation: userIdOp,
        value: userIdString[0],
      }),
      ...buildQueryCondition({
        field: 'expenseTypeId',
        operation: expenseTypeIdOp,
        value: expenseTypeIdString[0],
      }),
    }

    const where = noFilterGiven
      ? { deletedAt: null }
      : operator === 'and'
        ? { AND: query, deletedAt: null }
        : { OR: [query], deletedAt: null }

    const [data, count] = await prisma.$transaction([
      prisma.reimbursement.findMany({
        where,
        orderBy:
          column && getFieldName(column) in ReimbursementSchema.shape
            ? { [getFieldName(column)]: order }
            : { createdAt: 'desc' },
        include: {
          case: true,
          user: true,
          expenseType: true,
        },
        take: per_page,
        skip,
      }),
      prisma.reimbursement.count({ where }),
    ])

    const pageCount = Math.ceil(count / per_page)
    return NextResponse.json({ data, pageCount }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = ReimbursementOptionalDefaultsSchema.parse(await request.json())
    const reimbursement = await prisma.reimbursement.create({
      data,
      include: {
        case: true,
        user: true,
        expenseType: true,
      },
    })
    return NextResponse.json({ data: reimbursement }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const { id, ...data } = await request.json()

  try {
    const updatedData = ReimbursementPartialSchema.parse(data)
    const reimbursement = await prisma.reimbursement.update({
      where: { id },
      data: updatedData,
      include: {
        case: true,
        user: true,
        expenseType: true,
      },
    })
    return NextResponse.json({ data: reimbursement }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json()

  try {
    await prisma.reimbursement.delete({
      where: { id },
    })
    return NextResponse.json(
      { message: 'Reimbursement deleted' },
      { status: 200 },
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function getFieldName(str: string): string {
  switch (str) {
    case 'description':
      return 'description'
    case 'amount':
      return 'amount'
    case 'caseId':
      return 'caseId'
    case 'userId':
      return 'userId'
    case 'expenseTypeId':
      return 'expenseTypeId'
    default:
      return ''
  }
}