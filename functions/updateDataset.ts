import { Storage } from '@google-cloud/storage';
import { UserService, userProfile } from '../services/user.service';

interface Dataset {
  features: number[][];
  labels: number[];
}

const updateDataset = async (userProfile: userProfile) => {
    const storage = new Storage();
    const bucket = storage.bucket('your-bucket-name');
    const file = bucket.file('dataset.csv');
  
    // Download the current dataset from storage
    const fileContents = await file.download();
    const rows = fileContents[0].toString().split('\n');
    const features: number[][] = [];
    const labels: number[] = [];
    rows.forEach((row) => {
      const data = row.split(',');
      if (data.length > 1) {
        const label = parseInt(data.shift()!, 10);
        const feature = data.map((value) => parseFloat(value));
        labels.push(label);
        features.push(feature);
      }
    });
  
    // Add the new userProfile to the dataset
    const userProfileFeatures = Object.values(userProfile.features);
    const userProfileLabel = userProfile.category;
    labels.push(userProfileLabel);
    features.push(userProfileFeatures);
  
    // Write the updated dataset back to storage
    const updatedDataset = features.map((feature, index) => `${labels[index]},${feature.join(',')}`).join('\n');
    await file.save(updatedDataset);
  
    console.log('Dataset updated successfully');
  };
  