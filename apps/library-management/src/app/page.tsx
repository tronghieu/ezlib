import { LibrarySelectionPage } from "@/components/library/library-selection-page";
import { UserInfoBox } from "@/components/library/user-info-box";

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            EzLib Library Management
          </h1>
          <p className="text-gray-600">
            Simple, modern library management for small and medium libraries
          </p>
        </div>

        {/* Library Selection will be handled by LibrarySelectionPage */}
        <LibrarySelectionPage />

        {/* User Info Box */}
        <UserInfoBox />
      </div>
    </main>
  );
}
