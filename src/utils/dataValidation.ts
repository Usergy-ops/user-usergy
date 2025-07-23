
export const validateAndCleanData = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return {};
  }

  const cleaned: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Skip undefined, null, and empty string values
    if (value === undefined || value === null || value === '') {
      continue;
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length > 0) {
        cleaned[key] = value.filter(item => item !== null && item !== undefined && item !== '');
      }
    }
    // Handle objects (like JSONB fields)
    else if (typeof value === 'object') {
      const cleanedObj = validateAndCleanData(value);
      if (Object.keys(cleanedObj).length > 0) {
        cleaned[key] = cleanedObj;
      }
    }
    // Handle primitive values
    else {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
};

export const validateRequiredFields = (data: any, requiredFields: string[]): string[] => {
  const missing: string[] = [];
  
  for (const field of requiredFields) {
    const value = data[field];
    
    if (value === undefined || value === null || value === '') {
      missing.push(field);
    }
    
    if (Array.isArray(value) && value.length === 0) {
      missing.push(field);
    }
  }
  
  return missing;
};
