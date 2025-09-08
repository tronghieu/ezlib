import { 
  bookCopyUpdateSchema, 
  validateCopyNumber, 
  generateNextCopyNumber,
  validateLocation,
  type BookCopyUpdateData 
} from "../book-copy";

describe("bookCopyUpdateSchema", () => {
  it("should validate valid book copy update data", () => {
    const validData: BookCopyUpdateData = {
      copy_number: "A-001",
      shelf_location: "A1",
      section: "Fiction",
      call_number: "FIC-SMI-001",
      condition: "good",
      notes: "Some wear on the cover",
    };

    const result = bookCopyUpdateSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validData);
    }
  });

  it("should validate minimal valid data", () => {
    const minimalData: BookCopyUpdateData = {
      condition: "good",
    };

    const result = bookCopyUpdateSchema.safeParse(minimalData);
    expect(result.success).toBe(true);
  });

  it("should accept empty strings for optional location fields", () => {
    const dataWithEmptyStrings = {
      copy_number: "A-001",
      location: {
        shelf: "",
        section: "",
        call_number: "",
      },
      condition_info: {
        condition: "good",
        notes: "",
      },
    };

    const result = bookCopyUpdateSchema.safeParse(dataWithEmptyStrings);
    expect(result.success).toBe(true);
  });

  describe("copy_number validation", () => {
    it("should accept valid copy numbers", () => {
      const validCopyNumbers = [
        "A-001",
        "BK-2024-001",
        "FICTION_001",
        "123",
        "A1B2C3",
      ];

      validCopyNumbers.forEach(copyNumber => {
        const result = bookCopyUpdateSchema.safeParse({
          copy_number: copyNumber,
          condition: "good",
        });
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid copy numbers", () => {
      const invalidCopyNumbers = [
        "A B", // Contains space
        "A@001", // Special character @
        "A-001-WITH-VERY-LONG-NAME-THAT-EXCEEDS-FIFTY-CHARACTERS-LIMIT", // Too long (over 50 chars)
      ];

      invalidCopyNumbers.forEach(copyNumber => {
        const result = bookCopyUpdateSchema.safeParse({
          copy_number: copyNumber,
          condition: "good",
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("location validation", () => {
    it("should accept valid location data", () => {
      const validLocations = [
        { shelf: "A1", section: "Fiction", call_number: "FIC-001" },
        { shelf: "MAIN-01" },
        { section: "Reference" },
        { call_number: "796.332 SMI" },
        {}, // Empty location
      ];

      validLocations.forEach(location => {
        const result = bookCopyUpdateSchema.safeParse({
          copy_number: "A-001",
          location,
          condition: "good",
        });
        expect(result.success).toBe(true);
      });
    });

    it("should reject location fields that are too long", () => {
      const longString = "A".repeat(51); // 51 characters

      const invalidLocations = [
        { shelf: longString },
        { section: longString },
        { call_number: "A".repeat(101) }, // 101 characters
      ];

      invalidLocations.forEach(location => {
        const result = bookCopyUpdateSchema.safeParse({
          copy_number: "A-001",
          location,
          condition: "good",
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("condition_info validation", () => {
    it("should accept all valid condition values", () => {
      const validConditions = ["excellent", "good", "fair", "poor"] as const;

      validConditions.forEach(condition => {
        const result = bookCopyUpdateSchema.safeParse({
          copy_number: "A-001",
          condition,
        });
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid condition values", () => {
      const invalidConditions = ["mint", "damaged", "destroyed", ""];

      invalidConditions.forEach(condition => {
        const result = bookCopyUpdateSchema.safeParse({
          copy_number: "A-001",
          condition,
        });
        expect(result.success).toBe(false);
      });
    });

    it("should validate condition notes length", () => {
      // Valid notes
      const validNotes = [
        "",
        "Short note",
        "A".repeat(500), // Exactly 500 characters
      ];

      validNotes.forEach(notes => {
        const result = bookCopyUpdateSchema.safeParse({
          copy_number: "A-001",
          condition: "good",
          notes,
        });
        expect(result.success).toBe(true);
      });

      // Invalid notes (too long)
      const invalidNotes = "A".repeat(501); // 501 characters
      const result = bookCopyUpdateSchema.safeParse({
        copy_number: "A-001",
        condition: "good",
        notes: invalidNotes,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("validateCopyNumber", () => {
  it("should validate unique copy numbers", () => {
    const existingNumbers = ["A-001", "A-002", "B-001"];
    
    const result = validateCopyNumber("A-003", existingNumbers);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should reject duplicate copy numbers", () => {
    const existingNumbers = ["A-001", "A-002", "B-001"];
    
    const result = validateCopyNumber("A-001", existingNumbers);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Copy number already exists");
    expect(result.suggestion).toBe("A-003");
  });

  it("should handle empty existing numbers list", () => {
    const result = validateCopyNumber("A-001", []);
    expect(result.isValid).toBe(true);
  });

  it("should validate format requirements", () => {
    const invalidFormats = ["", "A B", "A@001"];
    
    invalidFormats.forEach(copyNumber => {
      const result = validateCopyNumber(copyNumber, []);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

describe("generateNextCopyNumber", () => {
  it("should generate next number with numeric suffix", () => {
    const existingNumbers = ["A-001", "A-002", "A-003"];
    
    const nextNumber = generateNextCopyNumber("A-001", existingNumbers);
    expect(nextNumber).toBe("A-004");
  });

  it("should maintain zero padding", () => {
    const existingNumbers = ["BK-0001", "BK-0002"];
    
    const nextNumber = generateNextCopyNumber("BK-0001", existingNumbers);
    expect(nextNumber).toBe("BK-0003");
  });

  it("should handle non-numeric suffix by adding number", () => {
    const existingNumbers = ["SPECIAL"];
    
    const nextNumber = generateNextCopyNumber("SPECIAL", existingNumbers);
    expect(nextNumber).toBe("SPECIAL-001");
  });

  it("should find available number when gaps exist", () => {
    const existingNumbers = ["A-001", "A-003", "A-004"];
    
    const nextNumber = generateNextCopyNumber("A-001", existingNumbers);
    expect(nextNumber).toBe("A-002"); // Should find next available number
  });

  it("should handle complex prefixes", () => {
    const existingNumbers = ["FICTION-SCI-FI-001", "FICTION-SCI-FI-002"];
    
    const nextNumber = generateNextCopyNumber("FICTION-SCI-FI-001", existingNumbers);
    expect(nextNumber).toBe("FICTION-SCI-FI-003");
  });
});

describe("validateLocation", () => {
  it("should validate complete location", () => {
    const location = {
      shelf: "A1",
      section: "Fiction",
      call_number: "FIC-SMI-001",
    };
    
    const result = validateLocation(location);
    expect(result.isValid).toBe(true);
  });

  it("should validate partial location", () => {
    const locations = [
      { shelf: "A1" },
      { section: "Fiction" },
      { call_number: "796.332 SMI" },
      {},
    ];
    
    locations.forEach(location => {
      const result = validateLocation(location);
      expect(result.isValid).toBe(true);
    });
  });

  it("should reject invalid location data", () => {
    const invalidLocations = [
      { shelf: "A".repeat(51) }, // Too long
      { section: "B".repeat(51) }, // Too long  
      { call_number: "C".repeat(101) }, // Too long
    ];
    
    invalidLocations.forEach(location => {
      const result = validateLocation(location);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});