import {
  CaseOptionalDefaultsSchema,
  CasePartialSchema,
  CaseSchema,
} from '@db/prisma/zod'
import { NextRequest, NextResponse } from 'next/server'
import {
  buildArrayQueryCondition,
  buildQueryCondition,
  splitString,
} from '@common/utils/get-table-data'

import { getCasesSchema } from '@common/validations/case-search'
import { prisma } from '@db/prisma'

export async function GET(request: NextRequest) {
  const params = Object.fromEntries([...request.nextUrl.searchParams])
  const id = request.nextUrl.searchParams.get('id')

  const include = {
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
  }

  try {
    if (id) {
      const data = await prisma.case.findUnique({
        where: { id },
        include,
      })
      return NextResponse.json({ data }, { status: 200 })
    }

    const {
      page,
      per_page,
      sort,
      operator,
      title,
      priority,
      caseNumber,
      assignedTo,
      filingDate,
      status,
      category,
      division,
      nature,
      lastAction,
    } = getCasesSchema.parse(params)
    const skip = (page - 1) * per_page
    const [column, order] = (sort?.split('.') as [
      string | undefined,
      'asc' | 'desc' | undefined,
    ]) ?? ['createdAt', 'desc']
    const [priorities, prioritiesOp] = splitString(priority)
    const [statuses, statusesOp] = splitString(status)
    const [categories, categoriesOp] = splitString(category)
    const [divisions, divisionsOp] = splitString(division)
    const [natures, naturesOp] = splitString(nature)
    const [titleString, titleOp] = splitString(title)
    const [caseNumberString, caseNumberOp] = splitString(caseNumber)
    const [lastActionString, lastActionOp] = splitString(lastAction)
    const [assignedToString, assignedToOp] = splitString(assignedTo)
    const [filingDateString, filingDateOp] = splitString(filingDate)
    const noFilterGiven = !(
      title ||
      priority ||
      caseNumber ||
      assignedTo ||
      filingDate ||
      status ||
      category ||
      division ||
      nature ||
      lastAction
    )

    const query = {
      ...buildQueryCondition({
        field: 'title',
        operation: titleOp,
        value: titleString[0],
      }),
      ...buildQueryCondition({
        field: 'caseNumber',
        operation: caseNumberOp,
        value: caseNumberString[0],
      }),
      ...buildQueryCondition({
        field: 'lastAction',
        operation: lastActionOp,
        value: lastActionString[0],
        subfield: 'action.title',
      }),
      ...buildQueryCondition({
        field: 'assignedTo',
        operation: assignedToOp,
        value: assignedToString[0],
        subfield: 'displayName',
      }),
      ...buildArrayQueryCondition({
        field: 'priority',
        operation: prioritiesOp,
        values: priorities,
        subfield: 'name',
      }),
      ...buildArrayQueryCondition({
        field: 'status',
        operation: statusesOp,
        values: statuses,
        subfield: 'name',
      }),
      ...buildArrayQueryCondition({
        field: 'category',
        operation: categoriesOp,
        values: categories,
        subfield: 'name',
      }),
      ...buildArrayQueryCondition({
        field: 'division',
        operation: divisionsOp,
        values: divisions,
        subfield: 'name',
      }),
      ...buildArrayQueryCondition({
        field: 'nature',
        operation: naturesOp,
        values: natures,
        subfield: 'name',
      }),
    }

    const where = noFilterGiven
      ? { deletedAt: null }
      : operator === 'and'
        ? { AND: query, deletedAt: null }
        : { OR: [query], deletedAt: null }

    const [data, count] = await prisma.$transaction([
      prisma.case.findMany({
        where,
        orderBy:
          column && getFieldName(column) in CaseSchema.shape
            ? { [getFieldName(column)]: order }
            : { createdAt: 'desc' },
        include,
        take: per_page,
        skip,
      }),
      prisma.case.count({
        where,
      }),
    ])
    const pageCount = Math.ceil(count / per_page)
    return NextResponse.json({ data, pageCount }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function getFieldName(str: string): string {
  switch (str) {
    case 'priority':
      return 'priorityKey'
    case 'title':
      return 'title'
    case 'caseNumber':
      return 'caseNumber'
    case 'assignedto':
      return 'assignedToId'
    case 'filingDate':
      return 'filingDate'
    case 'status':
      return 'statusKey'
    case 'category':
      return 'categoryId'
    case 'division':
      return 'divisionId'
    case 'nature':
      return 'natureId'
    default:
      return ''
  }
}