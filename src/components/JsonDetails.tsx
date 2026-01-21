// Purpose: Collapsible JSON viewer component.

interface JsonDetailsProps {
  data: unknown;
  title?: string;
}

export function JsonDetails({ data, title = "Raw JSON" }: JsonDetailsProps) {
  return (
    <details className="mt-4 rounded-lg border border-gray-200 bg-gray-50">
      <summary className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
        {title}
      </summary>
      <pre className="max-h-96 overflow-auto p-4 text-xs">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}
