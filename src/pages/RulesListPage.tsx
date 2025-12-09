import { Link } from "react-router-dom";

const mockRules = [
    {
        id: "rule_demo_1",
        name: "Open invoice amount sanity",
        status: "draft",
        mappingId: "stripe_invoice",
    },
];

export default function RulesListPage() {
    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        Validation rules
                    </h1>
                    <p className="text-sm text-slate-400">
                        In Sprint 5 this will call{" "}
                        <code className="font-mono text-xs">GET /validation-rules</code>.
                    </p>
                </div>
            </header>

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-900/80">
                    <tr className="border-b border-slate-800">
                        <th className="px-4 py-2 text-left font-medium text-slate-300">
                            Name
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-slate-300">
                            Mapping ID
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-slate-300">
                            Status
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {mockRules.map((rule) => (
                        <tr
                            key={rule.id}
                            className="border-t border-slate-800/60 hover:bg-slate-800/60 transition"
                        >
                            <td className="px-4 py-2">
                                <Link
                                    to={`/rules/${rule.id}`}
                                    className="text-sky-300 hover:text-sky-200 underline-offset-2 hover:underline"
                                >
                                    {rule.name}
                                </Link>
                            </td>
                            <td className="px-4 py-2 font-mono text-xs text-slate-300">
                                {rule.mappingId}
                            </td>
                            <td className="px-4 py-2">
                  <span className="inline-flex rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-xs font-medium text-amber-200">
                    {rule.status}
                  </span>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <p className="text-xs text-slate-500">
                Later: DSL summary column + &quot;Run job&quot; actions.
            </p>
        </div>
    );
}
