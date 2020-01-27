import logger from "../../../server/logger";
import { getCredentials, hasCredentialsFile } from "../../core/credentials";
import { reject } from "bluebird";
import { MongoClient, ObjectId } from "mongodb";

/**
 * This is the DAO service for Scicat. It uses a mongo connection
 * to retrieve data.  Database connection parameters are
 * provided by the credentials file (path defined in .env).
 */
export class MongoConnector {
  public static instance: MongoConnector;
  public db: null;

  private constructor() {
    logger.debug("Setting up the mongo connection.");

    // Get path from the environment.
    const credFile = process.env.SCICAT_CONFIGURATION;

    /*if (hasCredentialsFile(credFile)) {
      const creds = getCredentials(credFile);
    }*/
    const url = "mongodb://" + process.env.DB_HOSTNAME + ":27017";console.log(url);
	console.log(url);

    MongoClient.connect(url, (err, client) => {
      if (err) {
        logger.error("failed to connect", err);
        this.db = null;
      }
      this.db = client.db("dacat");
    });
  }

  public static getInstance(): MongoConnector {
    try {
      if (this.instance) {
        return this.instance;
      }
      this.instance = new MongoConnector();
      return this.instance;
    } catch (err) {
      throw new Error("Failed to get MongoConnector instance: " + err.message);
    }
  }

  /**
   * Responds to OAI ListRecords requests.
   * @param parameters
   * @returns {Promise<any>}
   */
  public recordsQuery(parameters: any): Promise<any> {
    if (!this.db) {
      reject("no db connection");
    }
    let PublishedData = this.db.collection("PublishedData");
    return new Promise((resolve: any, reject: any) => {
      PublishedData.find().toArray(function(err, items) {
        if (err) {
          reject(err);
        } else {
          resolve(items);
        }
      });
    });
  }

  /**
   * Responds to OAI ListIdentifiers requests.
   * @param parameters
   * @returns {Promise<any>}
   */
  public identifiersQuery(parameters: any): Promise<any> {
    if (!this.db) {
      reject("no db connection");
    }
    let PublishedData = this.db.collection("PublishedData");
    return new Promise((resolve: any, reject: any) => {
      // need to add relevant date to projection
      PublishedData.find({},{_id: 1 }).toArray(function(err, items) {
        if (err) {
          reject(err);
        } else {
          resolve(items);
        }
      });
    });
  }

  /**
   * Responds to OAI GetRecord requests.
   * @param parameters
   * @returns {Promise<any>}
   */
  public getRecord(parameters: any): Promise<any> {
    if (!this.db) {
      reject("no db connection");
    }
    let PublishedData = this.db.collection("PublishedData");
    return new Promise((resolve: any, reject: any) => {
      const query = {
        _id: ObjectId(parameters.identifier)
      };
      PublishedData.findOne(query, {}, function(err, item) {
        if (err) {
          reject(err);
        } else {
          resolve(item);
        }
      });
    });
  }

  private aggregatePublishedDataQuery(pipeline: any): Promise<any> {
    if (!this.db) {
      reject("no db connection");
    }
    var collection = this.db.collection("PublishedData");
    var resolve = null;
    return new Promise((resolve: any, err: any) => {
      var resolve = collection.aggregate(pipeline, function(err, cursor) {
        cursor.toArray(function(err, resolve) {
          if (err) {
            logger.error("recordsQuery error:", err);
          }
        });
      });
    });
  }
}
