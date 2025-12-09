import { Link } from "react-router-dom";

const mockJobs = [
    {
        id: "job_demo_1",
        ruleName: "Open invoice amount sanity",
        status: "success",
        runType: "full",
    },
];

function statusClasses(status: string) {
    switch (status) {
        case "success":
            return "border-emerald-400/40 bg-emerald-400/10 text-emerald-200";
        case "failed":
            return "border-rose-400/40 bg-rose-400/10 text-rose-200";
        default:
            return "border-slate-400/40 bg-slate-400/10 text-slate-200";
    }
}

export default function JobsListPage() {
    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        Validation jobs
                    </h1>
                    <p className="text-sm text-slate-400">
                        In Sprint 5 this will call{" "}
                        <code className="font-mono text-xs">GET /validation-jobs</code>.
                    </p>
                </div>
            </header>

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-900/80">
                    <tr className="border-b border-slate-800">
                        <th className="px-4 py-2 text-left font-medium text-slate-300">
                            Job ID
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-slate-300">
                            Rule
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-slate-300">
                            Status
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-slate-300">
                            Run type
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {mockJobs.map((job) => (
                        <tr
                            key={job.id}
                            className="border-t border-slate-800/60 hover:bg-slate-800/60 transition"
                        >
                            <td className="px-4 py-2">
                                <Link
                                    to={`/jobs/${job.id}`}
                                    className="font-mono text-xs text-sky-300 hover:text-sky-200 underline-offset-2 hover:underline"
                                >
                                    {job.id}
                                </Link>
                            </td>
                            <td className="px-4 py-2 text-slate-200">{job.ruleName}</td>
                            <td className="px-4 py-2">
                  <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusClasses(
                          job.status,
                      )}`}
                  >
                    {job.status}
                  </span>
                            </td>
                            <td className="px-4 py-2 text-xs text-slate-300 uppercase">
                                {job.runType}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <p className="text-xs text-slate-500">
                Later: client-side filters and search by job ID / rule name.
            </p>
        </div>
    );
}
