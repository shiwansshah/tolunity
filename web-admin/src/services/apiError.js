export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  const responseData = error?.response?.data;

  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData;
  }

  return (
    responseData?.error ||
    responseData?.message ||
    error?.message ||
    fallback
  );
}
