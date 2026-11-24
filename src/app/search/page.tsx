import Container from "@/components/container";
import React from "react";
import SearchResults from "./search-results";

const page = () => {
  return (
    <Container>
      <h1 className="sr-only">Search and browse anime</h1>
      <SearchResults />
    </Container>
  );
};

export default page;

