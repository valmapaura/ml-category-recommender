# Nearest Neighbor Algorithm for E-commerce Recommendations

## Table of Contents

- [Introduction](#introduction)
- [Algorithm Overview](#algorithm-overview)
- [Updating User Features](#updating-user-features)
- [Note on user features](#note-on-user-features)
- [Issues](#issues)
- [Conclusion](#conclusion)

## Introduction

Developed for an ecommerce app, this code presents a simple implementation of the nearest neighbor recommendation algorithm for an e-commerce app (in this case an Ionic Angular app) using K-Nearest Neighbors. The algorithm recommends similar product categories to users based on how they interact with products on the platform. It is deployed on Firebase Cloud Functions, which offloads computation from the client device to a serverless infrastructure, improving performance and scalability. The recommendation function is invoked by another cloud function that selects random products from the suggested categories, these products are then sent to the client-app.

Recommendations are based on 2 types of features:
- Personal features such as age and gender,
- Category interest features

## Algorithm Overview

The code loads a dataset from Google Cloud Storage, applies z-score normalization to it, and then uses the ml-knn library to perform k-nearest neighbor classification. The algorithm uses a dataset of user profiles with different preferences for various product categories. Each profile has a set of features indicating their preference level for each category. The algorithm calculates the similarity between the new user's profile and all the existing user profiles in the dataset using the KNN algorithm to make recommendations for a new user. The KNN algorithm selects the K most similar user profiles to the new user based on their feature values. Once the K's most similar user profiles are identified, the algorithm recommends product categories based on the most popular categories among those K users.

## Updating User Features

In an e-commerce app, it's important to keep track of a user's preferences and interests in different product categories. To achieve this the user's features are updated whenever a product is viewed, added to cart, or purchased.

In the `user.service.ts` I define the `updateUserFeatures` function shown below it uses Firebase Cloud Firestore. You can also find the `userProfile` Interface with the 97 features.

```typescript
async updateUserFeatures(fieldsToUpdate: Partial<userProfile>): Promise<void> {
  const user = await this.afAuth.currentUser;
  if (user) {
    const userDetailDocRef = this.firestore.doc<any>(`users/${user.uid}/profile/features`);
    for (const field in fieldsToUpdate) {
      if (fieldsToUpdate.hasOwnProperty(field)) {
        const incrementValue = fieldsToUpdate[field];
        const incrementField = {};
        incrementField[field] = firebase.firestore.FieldValue.increment(incrementValue);
        await userDetailDocRef.set(incrementField, { merge: true });
      }
    }
  }
}
```

For each field to be updated, the function creates an increment object using the firebase.firestore.FieldValue.increment method, which increments the specified field value (feature) by the specified amount. The function then sets the increment object using the set method with the { merge: true } option, which merges the new values with the existing values in the document. This allows more accurate and personalized recommendations. 

## Note on user features

The ML model includes a total of 97 features, with the first 5 being personal details of the user obtained during signup, and the remaining 92 features representing categories of products viewed and purchased, as explained above.

## Issues

There are a few issues with the current implementation that should be addressed to improve the performance and accuracy of the recommendation algorithm:

- Feature weighting: The algorithm needs to adjust the weights of the two types of features to better reflect their relative importance. For example, a user's age or gender may be more or less important than the product categories they view and purchase. Further testing is needed to determine the appropriate weights.

- User duration on platform: Currently, the recommendation algorithm does not account for the duration the user has been on the platform. Users who have used the platform for a longer time will have disproportionately higher feature numbers than someone who has used the platform for a shorter time. This needs to be taken into account in the algorithm to prevent biases.

- Dataset quality: The dataset provided by the client was not reliable and was collected over a short time. To address this, there is a need to update the dataset with user features of new people who sign up to improve the quality and reliability of the data. Additionally, more data from diverse user demographics should be collected to ensure that the algorithm can accurately recommend products to a wider range of users.

- Additional information can be utilized as features in the recommendation system. For instance, a user's social status can be inferred based on the device they use, which could be categorized as lower, middle, or upper income. It may not be appropriate to suggest low qaulity products to individuals in the upper income category. Similarly, the current implementation does not employ user search queries to generate recommendations.

## Conclusion

This recommendation system algorithm can provide useful suggestions to new users based on the preferences of similar users in the dataset, which can lead to higher user satisfaction and engagement with the platform or application using this algorithm.