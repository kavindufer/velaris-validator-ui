import { Link, useParams } from "react-router-dom";

export default function RuleDetailPage() {
    const { ruleId } = useParams<{ ruleId: string }>();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-1">
                        Validation rule
                    </p>
                    <h1 className="text-xl font-semibold tracking-tight break-all">
                        {ruleId ?? "Rule"}
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        This will show real rule metadata and DSL JSON, with buttons to run
                        preview/full jobs.
                    </p>
                </div>
                <Link
                    to="/rules"
                    className="text-xs text-slate-300 hover:text-slate-50 underline underline-offset-2"
                >
                    ← Back to rules
                </Link>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <h2 className="text-sm font-medium text-slate-200 mb-2">
                    Sprint 5 TODO
                </h2>
                <ul className="list-disc pl-5 text-xs text-slate-300 space-y-1">
                    <li>Fetch rule via GET /validation-rules/{"{rule_id}"}.</li>
                    <li>Render DSL JSON in a &lt;pre&gt; block / JSON viewer.</li>
                    <li>
                        Add &quot;Run full job&quot; and &quot;Run preview job&quot; buttons
                        to POST /validation-jobs.
                    </li>
                </ul>
            </div>
        </div>
    );
}
