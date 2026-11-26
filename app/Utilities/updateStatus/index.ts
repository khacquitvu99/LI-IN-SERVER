export async function updateStatusAndWorkflowLog(params: {
  productId: number | string;
  productStatus?: number;
  timestamp?: string;
}) {
  const numericId = Number(params.productId);
  const statusValue = params.productStatus ?? 1;
  const logTimestamp = params.timestamp || new Date().toISOString();

  // 1. Cập nhật lại productStatus = 1 qua /api/product
  const statusRes = await fetch("/api/product", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productID: Number.isFinite(numericId) ? numericId : params.productId,
      productStatus: statusValue,
    }),
  });

  const statusData = await statusRes.json().catch(() => ({}));
  if (!statusRes.ok || statusData?.success === false) {
    throw new Error(
      statusData?.message ||
        statusData?.error ||
        `Cập nhật productStatus=${statusValue} thất bại (HTTP ${statusRes.status})`,
    );
  }

  // 2. Gửi productId kèm thời gian thực lên /api/WorkflowLogs
  const logRes = await fetch("/api/WorkflowLogs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: Number.isFinite(numericId) ? numericId : params.productId,
      productStatus: statusValue,
      timestamp: logTimestamp,
    }),
  });

  const logData = await logRes.json().catch(() => ({}));
  if (!logRes.ok || logData?.success === false) {
    throw new Error(
      logData?.message ||
        logData?.error ||
        `Ghi WorkflowLogs thất bại (HTTP ${logRes.status})`,
    );
  }

  return { statusData, logData };
}
export const StatusWorklog = updateStatusAndWorkflowLog;
export default StatusWorklog;