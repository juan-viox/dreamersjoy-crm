import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crmConfig from '@/crm.config'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .select(
        '*, contact:contacts(first_name, last_name, email, phone, company:companies(name))'
      )
      .eq('id', id)
      .single()

    if (invErr || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const { data: items } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id)
      .order('sort_order')

    const lineItems = items ?? []
    const biz = crmConfig
    const branding = crmConfig.branding

    const contactName = invoice.contact
      ? `${invoice.contact.first_name} ${invoice.contact.last_name}`
      : ''
    const contactEmail = invoice.contact?.email ?? ''
    const contactPhone = invoice.contact?.phone ?? ''
    const contactCompany = (invoice.contact as any)?.company?.name ?? ''

    const formatMoney = (n: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }).format(n)

    const formatDateStr = (d: string) =>
      new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(d))

    const statusColor: Record<string, string> = {
      draft: '#888',
      sent: '#6c5ce7',
      paid: '#00b894',
      overdue: '#e17055',
      cancelled: '#636e72',
    }

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      color: #1a1a2e;
      background: #fff;
      padding: 48px;
      max-width: 800px;
      margin: 0 auto;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 24px;
      border-bottom: 2px solid ${branding.primaryColor};
    }

    .biz-name {
      font-size: 24px;
      font-weight: 700;
      color: ${branding.primaryColor};
      margin-bottom: 4px;
    }

    .biz-info {
      font-size: 12px;
      color: #666;
      line-height: 1.6;
    }

    .invoice-title {
      text-align: right;
    }

    .invoice-title h1 {
      font-size: 32px;
      font-weight: 700;
      color: ${branding.primaryColor};
      letter-spacing: 2px;
    }

    .invoice-number {
      font-size: 14px;
      color: #666;
      margin-top: 4px;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #fff;
      margin-top: 8px;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-bottom: 40px;
    }

    .meta-section h3 {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #999;
      margin-bottom: 8px;
    }

    .meta-section p {
      font-size: 14px;
      line-height: 1.6;
      color: #333;
    }

    .meta-section .name {
      font-weight: 600;
      font-size: 16px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }

    thead th {
      background: ${branding.primaryColor};
      color: #fff;
      padding: 12px 16px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: left;
    }

    thead th:last-child,
    thead th:nth-child(3),
    thead th:nth-child(4) {
      text-align: right;
    }

    tbody td {
      padding: 14px 16px;
      font-size: 13px;
      border-bottom: 1px solid #eee;
    }

    tbody td:last-child,
    tbody td:nth-child(3),
    tbody td:nth-child(4) {
      text-align: right;
    }

    tbody tr:hover { background: #fafafa; }

    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }

    .totals-table {
      width: 280px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
      color: #666;
    }

    .totals-row.total {
      border-top: 2px solid ${branding.primaryColor};
      padding-top: 12px;
      margin-top: 4px;
      font-size: 20px;
      font-weight: 700;
      color: ${branding.primaryColor};
    }

    .notes {
      padding: 20px;
      background: #f8f8fa;
      border-radius: 8px;
      border-left: 3px solid ${branding.accentColor};
    }

    .notes h3 {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #999;
      margin-bottom: 8px;
    }

    .notes p {
      font-size: 13px;
      color: #555;
      line-height: 1.6;
      white-space: pre-wrap;
    }

    .footer {
      margin-top: 48px;
      padding-top: 16px;
      border-top: 1px solid #eee;
      text-align: center;
      font-size: 11px;
      color: #aaa;
    }

    .print-actions {
      position: fixed;
      top: 16px;
      right: 16px;
      display: flex;
      gap: 8px;
      z-index: 100;
    }

    .print-actions button {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .print-actions button:hover { opacity: 0.85; }

    .btn-print {
      background: ${branding.primaryColor};
      color: #fff;
    }

    .btn-close {
      background: #eee;
      color: #333;
    }

    @media print {
      .print-actions { display: none; }
      body { padding: 24px; }
    }
  </style>
</head>
<body>
  <div class="print-actions">
    <button class="btn-print" onclick="window.print()">Print / Save PDF</button>
    <button class="btn-close" onclick="window.close()">Close</button>
  </div>

  <div class="header">
    <div>
      <div class="biz-name">${biz.name}</div>
      <div class="biz-info">
        ${biz.address}<br>
        ${biz.phone}<br>
        ${biz.email}<br>
        ${biz.website}
      </div>
    </div>
    <div class="invoice-title">
      <h1>INVOICE</h1>
      <div class="invoice-number">${invoice.invoice_number}</div>
      <span class="status-badge" style="background:${statusColor[invoice.status] ?? '#888'}">
        ${invoice.status.toUpperCase()}
      </span>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-section">
      <h3>Bill To</h3>
      <p class="name">${contactName}</p>
      ${contactCompany ? `<p>${contactCompany}</p>` : ''}
      ${contactEmail ? `<p>${contactEmail}</p>` : ''}
      ${contactPhone ? `<p>${contactPhone}</p>` : ''}
    </div>
    <div class="meta-section" style="text-align:right">
      <h3>Invoice Details</h3>
      <p><strong>Issue Date:</strong> ${formatDateStr(invoice.issue_date)}</p>
      ${invoice.due_date ? `<p><strong>Due Date:</strong> ${formatDateStr(invoice.due_date)}</p>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:40px">#</th>
        <th>Description</th>
        <th style="width:80px">Qty</th>
        <th style="width:120px">Unit Price</th>
        <th style="width:120px">Total</th>
      </tr>
    </thead>
    <tbody>
      ${lineItems
        .map(
          (item: any, i: number) => `
        <tr>
          <td style="color:#999">${i + 1}</td>
          <td style="font-weight:500">${item.description}</td>
          <td>${item.quantity}</td>
          <td>${formatMoney(Number(item.unit_price))}</td>
          <td style="font-weight:600">${formatMoney(Number(item.total))}</td>
        </tr>`
        )
        .join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-table">
      <div class="totals-row">
        <span>Subtotal</span>
        <span>${formatMoney(Number(invoice.subtotal))}</span>
      </div>
      ${
        Number(invoice.tax_rate) > 0
          ? `<div class="totals-row">
        <span>Tax (${invoice.tax_rate}%)</span>
        <span>${formatMoney(Number(invoice.tax_amount))}</span>
      </div>`
          : ''
      }
      <div class="totals-row total">
        <span>Total</span>
        <span>${formatMoney(Number(invoice.total))}</span>
      </div>
    </div>
  </div>

  ${
    invoice.notes
      ? `<div class="notes">
    <h3>Notes / Terms</h3>
    <p>${invoice.notes}</p>
  </div>`
      : ''
  }

  <div class="footer">
    ${biz.name} &middot; ${biz.address} &middot; ${biz.phone}
  </div>
</body>
</html>`

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
