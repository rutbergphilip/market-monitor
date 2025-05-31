import { computed, type Ref } from 'vue';

// Simple deep equality check without external dependencies
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (a == null || b == null) return a === b;

  if (typeof a !== typeof b) return false;

  if (typeof a !== 'object') return a === b;

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;

  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);

  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!bKeys.includes(key)) return false;
    if (!deepEqual(aObj[key], bObj[key])) return false;
  }

  return true;
}

/**
 * Composable for managing form button states based on data changes and validation
 * Automatically disables save/update/create buttons when:
 * - No changes have been made from initial data
 * - Form has validation errors
 */
export function useFormState<T = Record<string, unknown>>(
  options: FormStateOptions<T>
) {
  const { initialData, currentData, errors, isValid } = options;

  // Track if form has been modified
  const hasChanges = computed(() => {
    return !deepEqual(initialData, currentData.value);
  });

  // Track if form is valid (no errors)
  const isFormValid = computed(() => {
    // Use custom validation function if provided
    if (isValid) {
      return isValid();
    }

    // Otherwise check if there are no validation errors
    if (errors?.value) {
      return errors.value.length === 0;
    }

    // Default to true if no validation is provided
    return true;
  });

  // Button should be disabled if no changes or form is invalid
  const isButtonDisabled = computed(() => {
    return !hasChanges.value || !isFormValid.value;
  });

  // Helper to reset form to initial state
  const resetForm = () => {
    if (typeof currentData.value === 'object' && currentData.value !== null) {
      Object.assign(currentData.value, initialData);
    } else {
      currentData.value = initialData;
    }
  };

  // Helper to update initial data (useful after successful save)
  const updateInitialData = (newData: T) => {
    if (
      typeof initialData === 'object' &&
      initialData !== null &&
      typeof newData === 'object' &&
      newData !== null
    ) {
      Object.assign(initialData as Record<string, unknown>, newData);
    }
  };

  return {
    hasChanges: readonly(hasChanges),
    isFormValid: readonly(isFormValid),
    isButtonDisabled: readonly(isButtonDisabled),
    resetForm,
    updateInitialData,
  };
}

/**
 * Simplified version for components that just need to track changes
 * without complex validation
 */
export function useSimpleFormState<T = Record<string, unknown>>(
  initialData: T,
  currentData: Ref<T>
) {
  return useFormState({
    initialData,
    currentData,
  });
}
