import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MyListItem } from '../models/MyList';
import { Movie, TVShow } from '../models/Content';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ott-mylist';

async function runMigrations() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for migrations...');

    // Create indexes
    console.log('Creating indexes...');

    await MyListItem.collection.createIndex({ userId: 1, contentId: 1 }, { unique: true });
    console.log('✓ Created unique index on userId + contentId');

    await MyListItem.collection.createIndex({ userId: 1, addedAt: -1 });
    console.log('✓ Created index on userId + addedAt');

    await Movie.collection.createIndex({ id: 1 }, { unique: true });
    console.log('✓ Created unique index on Movie id');

    await TVShow.collection.createIndex({ id: 1 }, { unique: true });
    console.log('✓ Created unique index on TVShow id');

    console.log('✓ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations();
