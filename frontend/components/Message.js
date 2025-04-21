import { Bot, User, FileText } from 'lucide-react';

export function Message({ role, content, sources, error }) {
  return (
    <div className={`flex ${role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex gap-3 max-w-[80%] ${role === 'assistant' ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
          {role === 'assistant' ? (
            <Bot className="h-4 w-4" />
          ) : (
            <User className="h-4 w-4" />
          )}
        </div>
        <div className={`flex flex-col space-y-2 ${role === 'assistant' ? 'items-start' : 'items-end'}`}>
          <div className={`rounded-lg p-3 ${
            error 
              ? 'bg-red-100 text-red-900'
              : role === 'assistant'
                ? 'bg-gray-100'
                : 'bg-blue-500 text-white'
          }`}>
            <p className="text-sm whitespace-pre-wrap">{content}</p>
            {sources && sources.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {sources.map((source, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-200"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    {source}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 