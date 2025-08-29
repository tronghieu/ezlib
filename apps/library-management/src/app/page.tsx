import { LibrarySelectionPage } from "@/components/library/library-selection-page";

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            EzLib Library Management
          </h1>
          <p className="text-xl text-gray-600">
            Simple, modern library management for small and medium libraries
          </p>
        </div>

        {/* Library Selection will be handled by LibrarySelectionPage */}
        <LibrarySelectionPage />
      </div>
    </main>
  );
}
