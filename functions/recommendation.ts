import { Storage } from '@google-cloud/storage';
import { knn } from 'ml-knn';
import { UserProfile, UserService } from '../services/user.service';

interface Dataset {
  features: number[][];
  labels: number[];
}

// Declare dataset as a constant to prevent accidental modification
const dataset: Dataset = { features: [], labels: [] };

// Function to calculate the z-score of an array
const calculateZScore = (arr: number[]): number[] => {
  const mean = arr.reduce((sum, x) => sum + x) / arr.length;
  const std = Math.sqrt(arr.reduce((sum, x) => sum + (x - mean) ** 2) / arr.length);
  return arr.map((x) => (x - mean) / std);
};

// Load the dataset from Google Cloud Storage and apply z-score normalization
const loadDataset = async (): Promise<void> => {
  console.log('Loading dataset from storage...');

  // Create a new Storage instance and specify the name of the bucket and file containing the dataset
  const storage = new Storage();
  const bucket = storage.bucket('dataset');
  const file = bucket.file('dataset.csv');

  // Download the file contents and split it into rows
  const fileContents = await file.download();
  const rows = fileContents[0].toString().split('\n');

  // Iterate through each row of the dataset and extract the label and features
  rows.forEach((row) => {
    const data = row.split(',');
    if (data.length > 1) {
      const label = parseInt(data.shift()!, 10);
      const feature = data.map((value) => parseFloat(value));
      dataset.labels.push(label);
      dataset.features.push(feature);
    }
  });

  // Apply Z-score normalization to the dataset
  dataset.features = dataset.features.map((feature) => calculateZScore(feature));

  console.log('Dataset loaded successfully');
};

// Get recommended categories based on a user's profile
export const getRecommendedCategories = async (user: UserProfile): Promise<number[]> => {
  // If the dataset has not been loaded yet, load it from Google Cloud Storage
  if (dataset.features.length === 0 || dataset.labels.length === 0) {
    await loadDataset();
  }

  // Apply Z-score normalization to the user profile
  const normalizedUser = calculateZScore(Object.values(user));

  // Use the ml-knn library to perform k-nearest neighbor classification on the dataset
  const knnResult = knn(dataset.features, dataset.labels, normalizedUser, 5);

  // Get a list of unique categories recommended by the nearest neighbors
  const categories = Array.from(
    knnResult.reduce((uniqueCategories, nearestNeighbor) => {
      nearestNeighbor.result.forEach((category) => uniqueCategories.add(category));
      return uniqueCategories;
    }, new Set<number>())
  );

  return categories;
};
