// Purpose: Collapsible JSON viewer component.

interface JsonDetailsProps {
  data: unknown;
  title?: string;
}

export function JsonDetails({ data, title = "Raw JSON" }: JsonDetailsProps) {
  return (
    <details className="mt-6 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden transition-all duration-200 hover:border-gray-300">
      <summary className="cursor-pointer px-5 py-3 text-xs font-bold text-gray-700 uppercase tracking-wide hover:bg-gray-100 transition-colors flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
        {title}
      </summary>
      <div className="border-t border-gray-200 bg-gray-900">
        <pre className="max-h-96 overflow-auto p-5 text-xs font-mono text-gray-100 leading-relaxed">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </details>
  );
}
