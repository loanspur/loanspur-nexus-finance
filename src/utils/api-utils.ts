// API Query Utilities
// Safe query building and error handling

export const buildSafeSelect = (baseSelect: string, additionalFields?: string[]) => {
  const fields = [baseSelect];
  if (additionalFields) {
    fields.push(...additionalFields);
  }
  return fields.join(', ');
};

export const handleApiError = (error: any, context: string) => {
  console.error(`${context} error:`, error);
  
  if (error.code === 'PGRST116') {
    return new Error('Invalid query parameters. Please check your request.');
  }
  
  if (error.code === 'PGRST301') {
    return new Error('Access denied. Please check your permissions.');
  }
  
  return new Error(error.message || `${context} failed`);
};

export const safeApiQuery = async (queryFn: () => Promise<any>, context: string) => {
  try {
    return await queryFn();
  } catch (error) {
    throw handleApiError(error, context);
  }
};
