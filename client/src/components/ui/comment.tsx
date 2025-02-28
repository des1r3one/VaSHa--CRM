import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface CommentProps {
  author: {
    name: string;
    avatar?: string;
  };
  content: string;
  createdAt: Date | string;
  className?: string;
}

const Comment: React.FC<CommentProps> = ({
  author,
  content,
  createdAt,
  className = "",
}) => {
  const date = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const timeAgo = formatDistanceToNow(date, { addSuffix: true, locale: ru });

  return (
    <div className={`flex space-x-3 ${className}`}>
      <div className="flex-shrink-0">
        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
          {author.avatar ? (
            <img
              src={author.avatar}
              alt={author.name}
              className="h-10 w-10 rounded-full"
            />
          ) : (
            author.name.charAt(0).toUpperCase()
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900">{author.name}</p>
          <p className="text-xs text-gray-500">{timeAgo}</p>
        </div>
        <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
          {content}
        </div>
      </div>
    </div>
  );
};

interface CommentFormProps {
  onSubmit: (content: string) => void;
  isLoading?: boolean;
  className?: string;
}

const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  isLoading = false,
  className = "",
}) => {
  const [content, setContent] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !isLoading) {
      onSubmit(content);
      setContent("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`mt-4 ${className}`}>
      <textarea
        rows={3}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        placeholder="Добавить комментарий..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isLoading}
      />
      <div className="mt-2 flex justify-end">
        <button
          type="submit"
          disabled={!content.trim() || isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Отправка..." : "Отправить"}
        </button>
      </div>
    </form>
  );
};

export { Comment, CommentForm }; 