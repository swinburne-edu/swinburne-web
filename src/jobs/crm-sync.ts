import type { TaskConfig } from 'payload'

import { getCrmClient } from '@/lib/crm'
import { MAX_CRM_ATTEMPTS, queueCrmRetry, syncLeadToCrm, CRM_QUEUE } from '@/lib/leads/service'

/** Thử gửi lại 1 lead. Tự xếp lịch lần kế tiếp (backoff) nếu vẫn lỗi. */
export const crmSyncTask: TaskConfig<{ input: { leadId: number }; output: { status: string } }> = {
  slug: 'crmSync',
  label: 'Gửi lead sang CRM',
  inputSchema: [{ name: 'leadId', type: 'number', required: true }],
  outputSchema: [{ name: 'status', type: 'text' }],
  retries: 0,
  handler: async ({ input, req }) => {
    const outcome = await syncLeadToCrm(req.payload, input.leadId, { crm: getCrmClient() })
    if (outcome.status === 'pending') {
      await queueCrmRetry(req.payload, input.leadId, outcome.retryInMs)
    }
    return { output: { status: outcome.status } }
  },
}

/**
 * Lưới an toàn: lead "pending" bị bỏ quên (vd. job mất do restart giữa chừng) được gửi lại.
 * Chạy mỗi 15 phút.
 */
export const crmSweepTask: TaskConfig<{
  input: Record<string, never>
  output: { processed: number }
}> = {
  slug: 'crmSweep',
  label: 'Quét lead đang chờ',
  retries: 0,
  schedule: [{ cron: '0 */15 * * * *', queue: CRM_QUEUE }],
  handler: async ({ req }) => {
    const staleBefore = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const { docs } = await req.payload.find({
      collection: 'leads',
      overrideAccess: true,
      depth: 0,
      limit: 50,
      where: {
        and: [
          { crmStatus: { equals: 'pending' } },
          { crmAttempts: { less_than: MAX_CRM_ATTEMPTS } },
          {
            or: [
              { crmLastAttemptAt: { less_than: staleBefore } },
              { crmLastAttemptAt: { exists: false } },
            ],
          },
          { createdAt: { less_than: new Date(Date.now() - 5 * 60 * 1000).toISOString() } },
        ],
      },
    })
    const crm = getCrmClient()
    for (const lead of docs) {
      const outcome = await syncLeadToCrm(req.payload, lead.id, { crm })
      if (outcome.status === 'pending') await queueCrmRetry(req.payload, lead.id, outcome.retryInMs)
    }
    return { output: { processed: docs.length } }
  },
}
