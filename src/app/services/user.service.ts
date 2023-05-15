import { Injectable  } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import * as bowser from 'bowser';
import { Device } from '@capacitor/device';
import { Platform } from '@ionic/angular';
import { ToastController } from '@ionic/angular';
import { NetworkInterface } from '@capacitor-community/network-interface';

//firebase
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { reauthenticateWithCredential, EmailAuthProvider} from "firebase/auth";
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';

export interface userData {
  birthday: string,
  email: string,
  phone: string,
  name: string,
  surname: string,
  timestamp: Date;
  city: string,
  isMerchant: boolean
  gender: string,
}

// userProfile are features for machine learning algo
// first 5 fields capture personal features
export interface userProfile {
  gender: number,
  city: number,
  age: number,
  latitude: number;
  longitude: number;
  // Build profile based on user views and purchases
  electronics: number;
  laptopsAndNotebooks: number;
  smartphonesAndCellPhones: number;
  tabletsAndEReaders: number;
  tvsAndHomeTheater: number;
  headphonesAndSpeakers: number;
  camerasAndCamcorders: number;
  gamingAndVR: number;
  smartwatches: number;
  otherElectronics: number;
  clothing: number;
  mensClothing: number;
  womensClothing: number;
  kidsClothing: number;
  shoesAndFootwear: number;
  jewelryAndAccessories: number;
  swimwearAndBeachwear: number;
  activewearAndAthleisure: number;
  intimatesAndSleepwear: number;
  otherClothing: number;
  homeAndGarden: number;
  furniture: number;
  decor: number;
  beddingAndLinens: number;
  bathAndTowels: number;
  kitchenAndDining: number;
  appliancesAndElectronics: number;
  storageAndOrganization: number;
  outdoorLivingAndGardening: number;
  solarProductsAndAccessories: number;
  otherHomeAndGarden: number;
  beautyAndPersonalCare: number;
  skincare: number;
  makeup: number;
  haircare: number;
  fragrancesAndPerfumes: number;
  bathAndBody: number;
  oralCareAndHygiene: number;
  otherBeautyAndPersonalCare: number;
  sportsAndOutdoors: number;
  fitnessAndExercise: number;
  campingAndHiking: number;
  cyclingAndBiking: number;
  waterSportsAndBoating: number;
  winterSportsAndSkiing: number;
  huntingAndFishing: number;
  teamSportsAndAthletics: number;
  outdoorGearAndAccessories: number;
  otherSportsAndOutdoors: number;
  foodAndBeverage: number;
  freshProduce: number;
  cannedAndPackagedGoods: number;
  beverages: number;
  snacksAndCandy: number;
  bakeryAndDesserts: number;
  meatAndSeafood: number;
  dairyAndEggs: number;
  wineAndSpirits: number;
  otherFoodAndBeverage: number;
  servicesAndSoftware: number;
  professionalServices: number;
  personalServices: number;
  financialAndBanking: number;
  educationAndLearning: number;
  antivirusAndSecurity: number;
  productivityAndBusiness: number;
  gamesAndEntertainment: number;
  communicationAndSocialMedia: number;
  beautyAndPersonalCareServices: number;
  phoneAndComputerRepair: number;
  healthcareServices: number;
  transportationAndDelivery: number;
  petServices: number;
  homeMaintenanceAndCleaning: number;
  otherServicesAndSoftware: number;
  automotiveAndIndustrial: number;
  carsAndTrucks: number;
  motorcyclesAndATVs: number;
  partsAndAccessories: number;
  toolsAndEquipment: number;
  heavyMachineryAndConstruction: number;
  safetyAndProtectiveGear: number;
  industrialSuppliesAndMaterials: number;
  chemicalsAndLubricants: number;
  Generators: number;
  OtherAutomotiveandIndustrial: number;
  SolarProductsandAccessories: number;
  SolarPanels: number;
  SolarInverters: number;
  SolarBatteries: number;
  SolarChargeControllers: number;
  SolarMountingKits: number;
  OtherSolarProductsandAccessories: number;
}

@Injectable({
  providedIn: 'root'
})

export class UserService {

  userDetailDocRef: AngularFirestoreDocument;
  private subscription: Subscription = new Subscription();
  UserDetails: userData[];
  userAge: number;
  docId: string;
  lastLocation: any = null;
  db = firebase.firestore();
  ipAddress: string;

  constructor(
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private platform: Platform,
    private toastController: ToastController,
    ) {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        const userDetailDocRef = this.firestore.doc<any>(`users/${user.uid}/`);

        userDetailDocRef.valueChanges().subscribe((UserDetails: userData[]) => {
          this.UserDetails = UserDetails;
        });
      }
    });
  }

  async createUserDetails(formValues) {

    console.log('Passed in to create User Details: ' + formValues.email + formValues.gender + formValues.birthday );
    const userData: userData = {
      birthday: formValues.birthday,
      email: formValues.email,
      phone: '',
      name: formValues.name ?? '',
      surname: formValues.surname ?? '',
      timestamp: new Date(),
      city: '',
      isMerchant: false,
      gender: formValues.gender,
    };
    this.afAuth.authState.pipe(
      filter(user => !!user),
      switchMap(user => {
        const merchantDocRef = this.firestore.doc(`users/${user.uid}/`);
        console.log('writing to firebase: ' + formValues.email + formValues.gender + formValues.birthday );
        console.log( 'userData ' + userData.email + userData.gender +userData.birthday);
        return merchantDocRef.set(userData);
      })
    ).subscribe(() => {
      console.log('User details added to Firestore');
    }, error => {
      console.error('Error adding merchant details to Firestore:', error);
    });
  }

  async deleteUserAccount(currentPassword: string): Promise<void> {
    const user = await this.afAuth.currentUser;
    const userDetails = this.UserDetails[0];

    if (userDetails && userDetails.isMerchant) {
      this.showToast('Please delete your merchant account first before deleting your user account.', 'danger');
      return;
    }

    // Reauthenticate the user with their current password
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    //delete firestore user data
    try {
      await this.firestore.collection(`users`).doc(user.uid).delete();
    } catch (error) {
      console.error('Error deleting user data from Firestore', error);
    }

    // Delete the user's account
    await user.delete();
  }

  async createUserProfile(formValues) {
    const userProfile: userProfile = {
      city: 0, // in future we will need to code all cities
      gender: this.getGenderCode(formValues.gender),
      age: this.calculateAge(formValues.birthday),
      latitude: 0,
      longitude: 0,
      electronics: 0,
      laptopsAndNotebooks: 0,
      smartphonesAndCellPhones: 0,
      tabletsAndEReaders: 0,
      tvsAndHomeTheater: 0,
      headphonesAndSpeakers: 0,
      camerasAndCamcorders: 0,
      gamingAndVR: 0,
      smartwatches: 0,
      otherElectronics: 0,
      clothing: 0,
      mensClothing: 0,
      womensClothing: 0,
      kidsClothing: 0,
      shoesAndFootwear: 0,
      jewelryAndAccessories: 0,
      swimwearAndBeachwear: 0,
      activewearAndAthleisure: 0,
      intimatesAndSleepwear: 0,
      otherClothing: 0,
      homeAndGarden: 0,
      furniture: 0,
      decor: 0,
      beddingAndLinens: 0,
      bathAndTowels: 0,
      kitchenAndDining: 0,
      appliancesAndElectronics: 0,
      storageAndOrganization: 0,
      outdoorLivingAndGardening: 0,
      solarProductsAndAccessories: 0,
      otherHomeAndGarden: 0,
      beautyAndPersonalCare: 0,
      skincare: 0,
      makeup: 0,
      haircare: 0,
      fragrancesAndPerfumes: 0,
      bathAndBody: 0,
      oralCareAndHygiene: 0,
      otherBeautyAndPersonalCare: 0,
      sportsAndOutdoors: 0,
      fitnessAndExercise: 0,
      campingAndHiking: 0,
      cyclingAndBiking: 0,
      waterSportsAndBoating: 0,
      winterSportsAndSkiing: 0,
      huntingAndFishing: 0,
      teamSportsAndAthletics: 0,
      outdoorGearAndAccessories: 0,
      otherSportsAndOutdoors: 0,
      foodAndBeverage: 0,
      freshProduce: 0,
      cannedAndPackagedGoods: 0,
      beverages: 0,
      snacksAndCandy: 0,
      bakeryAndDesserts: 0,
      meatAndSeafood: 0,
      dairyAndEggs: 0,
      wineAndSpirits: 0,
      otherFoodAndBeverage: 0,
      servicesAndSoftware: 0,
      professionalServices: 0,
      personalServices: 0,
      financialAndBanking: 0,
      educationAndLearning: 0,
      antivirusAndSecurity: 0,
      productivityAndBusiness: 0,
      gamesAndEntertainment: 0,
      communicationAndSocialMedia: 0,
      beautyAndPersonalCareServices: 0,
      phoneAndComputerRepair: 0,
      healthcareServices: 0,
      transportationAndDelivery: 0,
      petServices: 0,
      homeMaintenanceAndCleaning: 0,
      otherServicesAndSoftware: 0,
      automotiveAndIndustrial: 0,
      carsAndTrucks: 0,
      motorcyclesAndATVs: 0,
      partsAndAccessories: 0,
      toolsAndEquipment: 0,
      heavyMachineryAndConstruction: 0,
      safetyAndProtectiveGear: 0,
      industrialSuppliesAndMaterials: 0,
      chemicalsAndLubricants: 0,
      Generators: 0,
      OtherAutomotiveandIndustrial: 0,
      SolarProductsandAccessories: 0,
      SolarPanels: 0,
      SolarInverters: 0,
      SolarBatteries: 0,
      SolarChargeControllers: 0,
      SolarMountingKits: 0,
      OtherSolarProductsandAccessories: 0,
    };
    const user = await this.afAuth.currentUser;
    const userDetailDocRef = this.firestore.doc<any>(`users/${user.uid}/profile/features`);
    await userDetailDocRef.set(userProfile);
  }

  async updateUserDetails(fieldsToUpdate: Partial<userData>): Promise<void> {
    const user = await this.afAuth.currentUser;
    if (user) {
      const userDetailDocRef = this.firestore.doc<any>(`users/${user.uid}/`);
      return userDetailDocRef.set(fieldsToUpdate, { merge: true });
    }
  }

  async updateUserlocation(fieldsToUpdate: Partial<userProfile>): Promise<void> {
    const user = await this.afAuth.currentUser;
    if (user) {
      const userDetailDocRef = this.firestore.doc<any>(`users/${user.uid}/profile/features`);
      return userDetailDocRef.set(fieldsToUpdate, { merge: true });
    }
  }

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

  getUserDetails(): Observable<userData> {
    return this.afAuth.authState.pipe(
      filter(user => !!user),
      switchMap(user => {
        const userDetailDocRef = this.firestore.doc<userData>(`users/${user.uid}/`);
        return userDetailDocRef.valueChanges();
      })
    );
  }

  calculateAge(birthday: string): number {
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  getGenderCode(gender: string): number {
    if (gender.toLowerCase() === 'other') {
      return 0;
    } else if (gender.toLowerCase() === 'male') {
      return 1;
    } else if (gender.toLowerCase() === 'female') {
      return 2;
    } else {
      throw new Error('Invalid gender value');
    }
  }

  //save user search queries to firestore only if the current search term is different from the last 10
  async saveUserSearchQuery(searchTerm: string) {
    const user = await this.afAuth.currentUser;
    if (user) {
      const searchQueryDocRef = this.db.collection('users').doc(user.uid).collection('SearchQuery').doc();

      // Retrieve last 10 search terms from local storage
      const lastSearchTerms = localStorage.getItem('lastSearchTerms');
      const searchTermsArray = lastSearchTerms ? JSON.parse(lastSearchTerms) : [];

      // Check if the new search term already exists in the last 10 search terms
      if (searchTermsArray.indexOf(searchTerm) === -1) {
        // Add the new search term to the last 10 search terms
        searchTermsArray.push(searchTerm);
        if (searchTermsArray.length > 10) {
          // Remove the oldest search term if the last 10 search terms already reached the limit of 10
          searchTermsArray.shift();
        }

        // Save the updated last 10 search terms to local storage
        localStorage.setItem('lastSearchTerms', JSON.stringify(searchTermsArray));

        // Save the new search term to the database with timestamp
        searchQueryDocRef.set({
          searchTerm: searchTerm,
          timestamp: new Date()
        });
      }
    }
  }

  getIpAddress(){
    NetworkInterface.getWiFiIPAddress()
    .then(address => ipAddress = address.ip)
    .catch(error => console.error(error));
  }

  //save User device information
  async saveUserDeviceInfo() {
    const user = await this.afAuth.currentUser;
    if (user) {
      const deviceInfo = await this.getDeviceInfo();
      const now = new Date();
      const deviceInfoWithDate = {
        'deviceType': deviceInfo.deviceType,
        'deviceMaker': deviceInfo.deviceMaker,
        'os': deviceInfo.os,
        'osVersion': deviceInfo.osVersion.operatingSystem + ' ' + deviceInfo.osVersion.osVersion,
        'batteryLevel': deviceInfo.batteryInfo.batteryLevel,
        'isCharging': deviceInfo.batteryInfo.isCharging,
        'browserName': deviceInfo.browserName,
        'browserVersion': deviceInfo.browserVersion,
        'timestamp': now.toISOString()
      };
      //console.log(deviceInfoWithDate);
      this.db.collection('users').doc(user.uid).collection('profile').doc('deviceInfo').set(deviceInfoWithDate);
    }
  }

  async getDeviceInfo(): Promise<any> {
    const deviceType = this.platform.is('mobile') ? 'Mobile' : 'Desktop';
    const deviceMaker = this.getDeviceMaker();
    const os = this.platform.is('android') ? 'Android' : 'iOS';
    const osVersion = await Device.getInfo();
    const batteryInfo = await Device.getBatteryInfo();
    const browserInfo = bowser.parse(navigator.userAgent);
    const browserName = browserInfo.browser.name;
    const browserVersion = browserInfo.browser.version;

    return {
      deviceType,
      deviceMaker,
      os,
      osVersion,
      batteryInfo,
      browserName,
      browserVersion
    };
  }

  private getDeviceMaker(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf('iphone') !== -1 || userAgent.indexOf('ipad') !== -1) {
      return 'Apple';
    } else if (userAgent.indexOf('android') !== -1) {
      return 'Google';
    } else {
      return 'Unknown';
    }
  }

  unsubscribe(): void {
    this.subscription.unsubscribe();
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 4000,
      position: 'top'
    });
    toast.present();
  }

}

