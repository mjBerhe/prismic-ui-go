export function groupAndSumByYear(arr: number[]): number[] {
  return arr.reduce((acc: number[], curr: number, index: number) => {
    // Determine the current year group (every 12 elements)
    const yearIndex = Math.floor(index / 12);

    // If the group doesn't exist yet, initialize it to 0
    if (!acc[yearIndex]) {
      acc[yearIndex] = 0;
    }

    // Add the current value to the correct year group
    acc[yearIndex] += curr;

    return acc;
  }, []);
}

export function getEveryNthElement(arr: number[], n: number): number[] {
  return arr.filter((_, i) => (i + 1) % n === 0);
}

// given an array of file names that end with "file_name20240423.csv" return the latest file
export const getMostRecentFile = (fileList: string[]): string | undefined => {
  return fileList.reduce((latest, current) => {
    const latestDateStr = latest.match(/\d{8}(?=.csv)/)?.[0];
    const currentDateStr = current.match(/\d{8}(?=.csv)/)?.[0];

    if (latestDateStr && currentDateStr) {
      const latestDate = new Date(
        `${latestDateStr.slice(0, 4)}-${latestDateStr.slice(4, 6)}-${latestDateStr.slice(
          6
        )}`
      );
      const currentDate = new Date(
        `${currentDateStr.slice(0, 4)}-${currentDateStr.slice(
          4,
          6
        )}-${currentDateStr.slice(6)}`
      );

      return currentDate > latestDate ? current : latest;
    }

    return latest;
  });
};

// mainly used for liability_config.json file input paths
export const getRelativePath = (basePath: string, fullPath: string): string => {
  // Normalize the paths to avoid issues with slashes
  const normalizedBase = basePath.replace(/\\/g, "/");
  const normalizedFullPath = fullPath.replace(/\\/g, "/");

  // Split the paths into segments
  const baseSegments = normalizedBase.split("/");
  const fullSegments = normalizedFullPath.split("/");

  // Find the index of the first difference
  let commonLength = 0;
  for (let i = 0; i < Math.min(baseSegments.length, fullSegments.length); i++) {
    if (baseSegments[i] === fullSegments[i]) {
      commonLength++;
    } else {
      break;
    }
  }

  // Calculate how many directories to go up from the base path
  const segmentsToGoUp = baseSegments.length - commonLength;

  // Build the relative path by going up and then adding remaining full path segments
  const relativePathParts = [];

  // Add ".." for each directory we need to go up
  for (let i = 0; i < segmentsToGoUp; i++) {
    relativePathParts.push("..");
  }

  // Add the remaining segments from the full path
  relativePathParts.push(...fullSegments.slice(commonLength));

  // Join and return the relative path
  return relativePathParts.join("/");
};

export const normalizePathString = (path: string) => {
  return path.replace(/\\/g, "/");
};

export const getTraversalPathToFolder = (
  basePath: string,
  filePath: string
): string | null => {
  // Normalize paths
  const normalizedBasePath = basePath.replace(/\\/g, "/");
  const normalizedFilePath = filePath.replace(/\\/g, "/");

  // Check if paths are identical
  if (normalizedBasePath === normalizedFilePath) return null;

  // Generate a relative path from basePath to filePath
  const relativePath = getRelativePath(normalizedBasePath, normalizedFilePath);

  // Split the relative path and filter out any empty segments
  const pathSegments = relativePath.split("/").filter(Boolean);

  // Remove the last segment (the file name) if there is more than one segment
  const lastSegment = pathSegments[pathSegments.length - 1];

  if (lastSegment && /^[\w,\s-]+\.[A-Za-z]{2,5}$/.test(lastSegment)) {
    pathSegments.pop(); // Remove the last segment if its a file
  }

  // Construct the traversal path by joining segments
  return pathSegments.join("/") || null;
};

// Function to clean the JSON content by removing empty values and trailing commas
export const cleanJsonString = (jsonString: string): string => {
  // Step 1: Remove trailing commas before closing braces and brackets
  const cleanedTrailingCommas = jsonString.replace(/,\s*([}\]])/g, "$1");

  // Step 2: Replace empty values after colons with empty quotes
  const cleanedEmptyValues = cleanedTrailingCommas.replace(/:\s*,/g, ': "",');

  // Additional step: Handle cases where there might be an empty value followed by a closing brace or bracket
  return cleanedEmptyValues.replace(/:\s*([}\]])/g, ': ""$1');
};

export const isValidOutputFolder = (files: string[]): boolean => {
  if (files.length < 3) return false;

  const hasIncomeStatementFile = files.some((file) =>
    file.includes("IncomeStatement_SPDA_S0_0_")
  );
  const hasDetailsOutputFile = files.some((file) =>
    file.includes("DetailOutput_SPDA_S0_0_")
  );
  const hasBalanceSheetFile = files.some((file) =>
    file.includes("BalanceSheet_SPDA_S0_0_")
  );

  return hasIncomeStatementFile && hasDetailsOutputFile && hasBalanceSheetFile;
};

// TODO: FUNCTION NEEDS FURTHER TESTING
export const resolvePath = (basePath: string, relativePath: string): string => {
  const baseParts = basePath.split("/");
  const lastPart = baseParts[baseParts.length - 1];

  // Check if the last part of basePath has a file extension
  if (/^[\w,\s-]+\.[A-Za-z]{2,5}$/.test(lastPart)) {
    const file = baseParts.pop(); // Remove the filename if it has an extension
    console.log(file);
  }

  const relativeParts = relativePath.split("/");

  for (const part of relativeParts) {
    if (part === "..") {
      baseParts.pop(); // Go up one directory
    } else if (part !== ".") {
      baseParts.push(part); // Add the current directory or file
    }
  }

  return baseParts.join("/");
};
