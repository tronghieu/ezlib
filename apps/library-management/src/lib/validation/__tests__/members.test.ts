import {
  memberRegistrationSchema,
  memberUpdateSchema,
  type MemberRegistrationData,
  type MemberUpdateData,
} from "../members";

describe("Member Validation Schemas", () => {
  describe("memberRegistrationSchema", () => {
    it("should validate valid member registration data", () => {
      const validData: MemberRegistrationData = {
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@example.com",
        phone: "+1234567890",
        street: "123 Main St",
        city: "New York",
        state: "NY",
        country: "USA",
        postal_code: "10001",
        membership_type: "regular",
        membership_notes: "New member",
      };

      const result = memberRegistrationSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it("should require first name, last name, and email", () => {
      const invalidData = {
        phone: "+1234567890",
      };

      const result = memberRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten();
        expect(errors.fieldErrors.first_name).toBeDefined();
        expect(errors.fieldErrors.last_name).toBeDefined();
        expect(errors.fieldErrors.email).toBeDefined();
      }
    });

    it("should validate email format", () => {
      const invalidEmail = {
        first_name: "John",
        last_name: "Doe",
        email: "invalid-email",
      };

      const result = memberRegistrationSchema.safeParse(invalidEmail);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten();
        expect(errors.fieldErrors.email?.[0]).toContain("valid email");
      }
    });

    it("should validate phone number format", () => {
      const testCases = [
        { phone: "+1234567890", valid: true },
        { phone: "1234567890", valid: true },
        { phone: "+12", valid: true },
        { phone: "invalid-phone", valid: false },
        { phone: "++123", valid: false },
        { phone: "0123", valid: false },
        { phone: "+0123", valid: false }, // Cannot start with 0
      ];

      testCases.forEach(({ phone, valid }) => {
        const data = {
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
          phone,
        };

        const result = memberRegistrationSchema.safeParse(data);
        if (valid) {
          expect(result.success).toBe(true);
        } else {
          expect(result.success).toBe(false);
          if (!result.success) {
            const errors = result.error.flatten();
            expect(errors.fieldErrors.phone).toBeDefined();
          }
        }
      });
    });

    it("should accept optional member_id", () => {
      const dataWithId = {
        member_id: "M001",
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
      };

      const result = memberRegistrationSchema.safeParse(dataWithId);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.member_id).toBe("M001");
      }
    });

    it("should enforce character limits", () => {
      const longData = {
        member_id: "a".repeat(21), // Max 20
        first_name: "a".repeat(51), // Max 50
        last_name: "a".repeat(51), // Max 50
        email: "a".repeat(90) + "@test.com", // Max 100
        street: "a".repeat(101), // Max 100
        city: "a".repeat(51), // Max 50
        state: "a".repeat(51), // Max 50
        country: "a".repeat(51), // Max 50
        postal_code: "a".repeat(21), // Max 20
        membership_notes: "a".repeat(501), // Max 500
      };

      const result = memberRegistrationSchema.safeParse(longData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten();
        expect(errors.fieldErrors.member_id).toBeDefined();
        expect(errors.fieldErrors.first_name).toBeDefined();
        expect(errors.fieldErrors.last_name).toBeDefined();
        expect(errors.fieldErrors.email).toBeDefined();
        expect(errors.fieldErrors.street).toBeDefined();
        expect(errors.fieldErrors.city).toBeDefined();
        expect(errors.fieldErrors.state).toBeDefined();
        expect(errors.fieldErrors.country).toBeDefined();
        expect(errors.fieldErrors.postal_code).toBeDefined();
        expect(errors.fieldErrors.membership_notes).toBeDefined();
      }
    });

    it("should validate membership type enum", () => {
      const validTypes = ["regular", "student", "senior"];

      validTypes.forEach((type) => {
        const data = {
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
          membership_type: type as "regular" | "student" | "senior",
        };

        const result = memberRegistrationSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      const invalidData = {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        membership_type: "invalid",
      };

      const result = memberRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should handle empty optional fields", () => {
      const minimalData = {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
      };

      const result = memberRegistrationSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.phone).toBeUndefined();
        expect(result.data.street).toBeUndefined();
        expect(result.data.membership_notes).toBeUndefined();
      }
    });

    it("should allow empty string for optional phone field", () => {
      const data = {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        phone: "",
      };

      const result = memberRegistrationSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.phone).toBe("");
      }
    });

    it("should transform nested address to flat fields", () => {
      const nestedData = {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        address: {
          street: "123 Main St",
          city: "New York",
          state: "NY",
          postal_code: "10001",
        },
      };

      const result = memberRegistrationSchema.safeParse(nestedData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.street).toBe("123 Main St");
        expect(result.data.city).toBe("New York");
        expect(result.data.state).toBe("NY");
        expect(result.data.postal_code).toBe("10001");
      }
    });

    it("should prefer flat fields over nested address", () => {
      const mixedData = {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        street: "456 Second St",
        city: "Boston",
        address: {
          street: "123 Main St",
          city: "New York",
        },
      };

      const result = memberRegistrationSchema.safeParse(mixedData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.street).toBe("456 Second St");
        expect(result.data.city).toBe("Boston");
      }
    });

    it("should default membership_type to regular", () => {
      const data = {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
      };

      const result = memberRegistrationSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.membership_type).toBe("regular");
      }
    });
  });

  describe("memberUpdateSchema", () => {
    it("should allow partial updates", () => {
      const partialData: MemberUpdateData = {
        email: "newemail@example.com",
      };

      const result = memberUpdateSchema.safeParse(partialData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("newemail@example.com");
        expect(result.data.first_name).toBeUndefined();
      }
    });

    it("should validate email format in updates", () => {
      const invalidUpdate = {
        email: "invalid-email",
      };

      const result = memberUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten();
        expect(errors.fieldErrors.email?.[0]).toContain("valid email");
      }
    });

    it("should allow status updates", () => {
      const statusUpdate = {
        status: "inactive",
      };

      const result = memberUpdateSchema.safeParse(statusUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("inactive");
      }
    });

    it("should validate status enum values", () => {
      const validStatuses = ["active", "inactive", "banned"];

      validStatuses.forEach((status) => {
        const data = { status };
        const result = memberUpdateSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      const invalidStatus = { status: "invalid" };
      const result = memberUpdateSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
    });

    it("should allow empty object for no updates", () => {
      const emptyUpdate = {};
      const result = memberUpdateSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Object.keys(result.data)).toHaveLength(0);
      }
    });

    it("should handle address updates with transformation", () => {
      const addressUpdate = {
        address: {
          street: "789 Third Ave",
          city: "Chicago",
        },
      };

      const result = memberUpdateSchema.safeParse(addressUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.street).toBe("789 Third Ave");
        expect(result.data.city).toBe("Chicago");
      }
    });

    it("should validate phone format in updates", () => {
      const validPhone = {
        phone: "+9876543210",
      };

      const result = memberUpdateSchema.safeParse(validPhone);
      expect(result.success).toBe(true);

      const invalidPhone = {
        phone: "invalid",
      };

      const invalidResult = memberUpdateSchema.safeParse(invalidPhone);
      expect(invalidResult.success).toBe(false);
    });

    it("should enforce character limits in updates", () => {
      const longUpdate = {
        first_name: "a".repeat(51),
        email: "a".repeat(95) + "@example.com",
      };

      const result = memberUpdateSchema.safeParse(longUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten();
        expect(errors.fieldErrors.first_name).toBeDefined();
        expect(errors.fieldErrors.email).toBeDefined();
      }
    });
  });

  describe("Edge Cases and Special Scenarios", () => {
    it("should handle international phone numbers", () => {
      const internationalPhones = [
        "+442071234567", // UK
        "+33123456789", // France
        "+861234567890", // China
        "+12025551234", // US
      ];

      internationalPhones.forEach((phone) => {
        const data = {
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
          phone,
        };

        const result = memberRegistrationSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it("should handle special characters in names", () => {
      const specialNames = {
        first_name: "Jean-Pierre",
        last_name: "O'Brien",
        email: "jean@example.com",
      };

      const result = memberRegistrationSchema.safeParse(specialNames);
      expect(result.success).toBe(true);
    });

    it("should validate member ID format", () => {
      const validIds = ["M001", "CARD-123", "USER_456", "A1B2C3"];
      const invalidIds = ["M 001", "CARD@123", "USER%456", ""];

      validIds.forEach((member_id) => {
        const data = {
          member_id,
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
        };
        const result = memberRegistrationSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      invalidIds.forEach((member_id) => {
        const data = {
          member_id,
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
        };
        const result = memberRegistrationSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    it("should validate name format with regex", () => {
      const validNames = {
        first_name: "Jean-Pierre O'Malley",
        last_name: "Van Der Berg Jr.",
        email: "jean@example.com",
      };

      const result = memberRegistrationSchema.safeParse(validNames);
      expect(result.success).toBe(true);

      const invalidNames = {
        first_name: "John123",
        last_name: "Doe@invalid",
        email: "john@example.com",
      };

      const invalidResult = memberRegistrationSchema.safeParse(invalidNames);
      expect(invalidResult.success).toBe(false);
    });

    it("should handle international addresses", () => {
      const internationalAddress = {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        street: "123 Rue de la Paix",
        city: "Paris",
        state: "Île-de-France",
        country: "France",
        postal_code: "75002",
      };

      const result = memberRegistrationSchema.safeParse(internationalAddress);
      expect(result.success).toBe(true);
    });

    it("should handle email addresses with various formats", () => {
      const emailFormats = [
        "user@example.com",
        "user.name@example.com",
        "user+tag@example.com",
        "user_name@example.co.uk",
        "123@example.com",
      ];

      emailFormats.forEach((email) => {
        const data = {
          first_name: "John",
          last_name: "Doe",
          email,
        };

        const result = memberRegistrationSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid email formats", () => {
      const invalidEmails = [
        "plaintext",
        "@example.com",
        "user@",
        "user @example.com",
        "user@example",
        "user@@example.com",
      ];

      invalidEmails.forEach((email) => {
        const data = {
          first_name: "John",
          last_name: "Doe",
          email,
        };

        const result = memberRegistrationSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });
});
