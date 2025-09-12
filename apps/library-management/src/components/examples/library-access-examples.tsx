"use client";

/**
 * Examples demonstrating the new Library Context patterns
 * Shows how to replace HOC usage with modern hook-based approaches
 */

import React from "react";
import { useLibraryContext, useRequireLibrary } from "@/lib/contexts/library-provider";

// =============================================================================
// EXAMPLE 1: Basic Library Context Usage
// =============================================================================

export function BasicLibraryInfo(): React.JSX.Element {
  const { 
    currentLibrary, 
    availableLibraries, 
    isLoading, 
    error,
    canManageBooks,
    getCurrentRole 
  } = useLibraryContext();

  if (isLoading) {
    return <div>Loading library information...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  if (!currentLibrary) {
    return (
      <div>
        <h3>No Library Selected</h3>
        <p>Available libraries: {availableLibraries.length}</p>
        <ul>
          {availableLibraries.map((lib) => (
            <li key={lib.id}>{lib.name} ({lib.code})</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div>
      <h3>Current Library: {currentLibrary.name}</h3>
      <p>Code: {currentLibrary.code}</p>
      <p>Your Role: {getCurrentRole()}</p>
      <p>Can Manage Books: {canManageBooks() ? 'Yes' : 'No'}</p>
    </div>
  );
}

// =============================================================================
// EXAMPLE 2: Protected Component (replaces HOC pattern)
// =============================================================================

export function ProtectedBookManager(): React.JSX.Element {
  // New hook-based approach instead of HOC
  const { currentLibrary, isLoading, hasAccess } = useRequireLibrary({
    requiredRoles: ["owner", "manager", "librarian"],
    redirectTo: "/auth/login?reason=insufficient_permissions"
  });

  // Loading state while checking access
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  // Access check - redirect will happen automatically if needed
  if (!hasAccess || !currentLibrary) {
    return <div />; // Component will redirect automatically
  }

  // Render protected content
  return (
    <div>
      <h2>Book Manager for {currentLibrary.name}</h2>
      <p>You have access to manage books in this library.</p>
      {/* Your protected book management UI here */}
    </div>
  );
}

// =============================================================================
// EXAMPLE 3: Role-Based Conditional Rendering
// =============================================================================

export function LibraryDashboard(): React.JSX.Element {
  const { 
    currentLibrary,
    canManageBooks,
    canManageMembers,
    canManageStaff,
    canViewReports,
    canManageSettings,
    hasRole
  } = useLibraryContext();

  if (!currentLibrary) {
    return <div>Please select a library to continue.</div>;
  }

  return (
    <div>
      <h1>Dashboard for {currentLibrary.name}</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {canManageBooks() && (
          <div className="p-4 border rounded-lg">
            <h3>Book Management</h3>
            <p>Add, edit, and organize books</p>
          </div>
        )}
        
        {canManageMembers() && (
          <div className="p-4 border rounded-lg">
            <h3>Member Management</h3>
            <p>Manage library members</p>
          </div>
        )}
        
        {canViewReports() && (
          <div className="p-4 border rounded-lg">
            <h3>Reports</h3>
            <p>View library statistics</p>
          </div>
        )}
        
        {canManageStaff() && (
          <div className="p-4 border rounded-lg">
            <h3>Staff Management</h3>
            <p>Manage library staff</p>
          </div>
        )}
        
        {canManageSettings() && (
          <div className="p-4 border rounded-lg">
            <h3>Settings</h3>
            <p>Library configuration</p>
          </div>
        )}
        
        {/* Custom role check */}
        {hasRole(["volunteer", "librarian", "manager", "owner"]) && (
          <div className="p-4 border rounded-lg">
            <h3>General Tasks</h3>
            <p>Available to all staff</p>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// EXAMPLE 4: Library Switching Component
// =============================================================================

export function LibrarySelector(): React.JSX.Element {
  const { 
    currentLibrary,
    availableLibraries,
    selectLibrary,
    clearLibrarySelection,
    isLoading
  } = useLibraryContext();

  if (isLoading) {
    return <div>Loading libraries...</div>;
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3>Library Selector</h3>
      
      {currentLibrary ? (
        <div className="mb-4">
          <p className="font-medium">Current: {currentLibrary.name}</p>
          <button
            onClick={() => clearLibrarySelection()}
            className="mt-2 px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear Selection
          </button>
        </div>
      ) : (
        <p className="mb-4 text-gray-600">No library selected</p>
      )}
      
      <div>
        <p className="font-medium mb-2">Available Libraries:</p>
        <ul className="space-y-2">
          {availableLibraries.map((library) => (
            <li key={library.id}>
              <button
                onClick={() => selectLibrary(library)}
                disabled={currentLibrary?.id === library.id}
                className={`
                  text-left p-2 rounded border w-full
                  ${currentLibrary?.id === library.id
                    ? 'bg-blue-100 border-blue-300 cursor-not-allowed'
                    : 'hover:bg-gray-50 border-gray-200'
                  }
                `}
              >
                <div className="font-medium">{library.name}</div>
                <div className="text-sm text-gray-600">
                  {library.code} • Role: {library.user_role}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// =============================================================================
// EXAMPLE 5: Migration Guide Component
// =============================================================================

export function MigrationGuide(): React.JSX.Element {
  return (
    <div className="p-6 bg-blue-50 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Migration Guide: HOC to Hooks</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-red-600">❌ Old HOC Pattern:</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm mt-2">
{`export default withLibraryAccess(MyComponent, {
  requireLibrarySelection: true,
  redirectTo: "/auth/login"
});`}
          </pre>
        </div>
        
        <div>
          <h3 className="font-semibold text-green-600">✅ New Hook Pattern:</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm mt-2">
{`function MyComponent() {
  const { currentLibrary, isLoading, hasAccess } = useRequireLibrary({
    requiredRoles: ["owner", "manager"],
    redirectTo: "/auth/login"
  });
  
  if (isLoading) return <Loading />;
  if (!hasAccess) return null; // Will redirect
  
  return <div>Protected content</div>;
}`}
          </pre>
        </div>
        
        <div>
          <h3 className="font-semibold text-green-600">✅ Role-Based Rendering:</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm mt-2">
{`function MyComponent() {
  const { canManageBooks, hasRole } = useLibraryContext();
  
  return (
    <div>
      {canManageBooks() && <BookManager />}
      {hasRole(["owner"]) && <AdminPanel />}
    </div>
  );
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}