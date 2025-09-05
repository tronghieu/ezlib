/**
 * Add Book Page
 * Ultra-simple add book form with minimal required information
 */

import React from "react";
import { AddBookPageClient } from "./add-book-client";

interface AddBookPageProps {
  params: Promise<{ "library-code": string }>;
}

export default async function AddBookPage({
  params,
}: AddBookPageProps): Promise<React.JSX.Element> {
  const { "library-code": libraryCode } = await params;

  return <AddBookPageClient libraryCode={libraryCode} />;
}
