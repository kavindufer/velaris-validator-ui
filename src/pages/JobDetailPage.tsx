import { Link, useParams } from "react-router-dom";

export default function JobDetailPage() {
    const { jobId } = useParams<{ jobId: string }>();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-1">
                        Validation job
                    </p>
                    <h1 className="text-xl font-semibold tracking-tight break-all">
                        {jobId ?? "Job"}
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Sprint 5 will display backing source (Stripe vs sample), metrics and
                        preview rows based on <code className="font-mono text-xs">summary_json</code>.
                    </p>
                </div>
                <Link
                    to="/jobs"
                    className="text-xs text-slate-300 hover:text-slate-50 underline underline-offset-2"
                >
                    ← Back to jobs
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                    <h2 className="text-sm font-medium text-slate-200 mb-2">
                        Metadata (placeholder)
                    </h2>
                    <p className="text-xs text-slate-300">
                        Later: rule name, status, run type, created/started/finished times.
                    </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                    <h2 className="text-sm font-medium text-slate-200 mb-2">
                        Execution summary (placeholder)
                    </h2>
                    <p className="text-xs text-slate-300">
                        Later: backing_source badge, metric value, rows_scanned,
                        rows_matched, stripe_invoice_count, and preview_rows table.
                    </p>
                </div>
            </div>
        </div>
    );
}
