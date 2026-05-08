import 'dotenv/config';
import { getDb } from '../config/db.js';
import bcrypt from 'bcryptjs';

async function seedUsers() {
  try {
    console.log('🌱 Iniciando seed de usuarios...');
    
    const db = await getDb();
    const users = db.collection('users');
    
    // Verificar si ya existen usuarios
    const count = await users.countDocuments();
    if (count > 0) {
      console.log(`✅ La base de datos ya tiene ${count} usuario(s). Saltando seed.`);
      process.exit(0);
    }

    // Crear usuarios de prueba
    const testUsers = [
      {
        name: 'Carlos',
        email: 'carlos@test.com',
        password: '123456',
        createdAt: new Date('2024-01-15')
      },
      {
        name: 'Maria',
        email: 'maria@test.com',
        password: '123456',
        createdAt: new Date('2024-02-20')
      },
      {
        name: 'Juan',
        email: 'juan@test.com',
        password: '123456',
        createdAt: new Date('2024-03-10')
      }
    ];

    // Hash passwords e insertar
    for (const user of testUsers) {
      user.passwordHash = await bcrypt.hash(user.password, 10);
      delete user.password;
    }

    const result = await users.insertMany(testUsers);
    console.log(`✅ ${result.insertedIds.length} usuarios creados`);

    // Crear juegos de prueba
    const games = db.collection('games');
    const gamesCount = await games.countDocuments();
    
    if (gamesCount === 0) {
      const testGames = [
        {
          title: 'Elden Ring',
          image: 'https://media.rawg.io/media/screenshots/7cf/7cfc87f6cd4f521d4551d1e618cdf87f.jpg',
          platform: 'PlayStation 5',
          price: 15,
          uploadedBy: result.insertedIds[0],
          available: true,
          createdAt: new Date()
        },
        {
          title: 'The Legend of Zelda: Tears of the Kingdom',
          image: 'https://media.rawg.io/media/screenshots/610/6101b1b305d3495b96995ce60129c905.jpg',
          platform: 'Nintendo Switch',
          price: 12,
          uploadedBy: result.insertedIds[0],
          available: true,
          createdAt: new Date()
        },
        {
          title: 'Cyberpunk 2077',
          image: 'https://media.rawg.io/media/screenshots/f05/f05f4b47e91c5edd8e1cd737b3b6e3c0.jpg',
          platform: 'Xbox Series X',
          price: 20,
          uploadedBy: result.insertedIds[1],
          available: true,
          createdAt: new Date()
        },
        {
          title: 'Spider-Man 2',
          image: 'https://media.rawg.io/media/screenshots/b72/b72fab21309ca04e78caa70e16fafcc9.jpg',
          platform: 'PlayStation 5',
          price: 18,
          uploadedBy: result.insertedIds[1],
          available: false,
          createdAt: new Date()
        },
        {
          title: 'Starfield',
          image: 'https://media.rawg.io/media/screenshots/8e0/8e0afaa34185b5b7534b16fdbdb79fdb.jpg',
          platform: 'Xbox Series X',
          price: 25,
          uploadedBy: result.insertedIds[2],
          available: true,
          createdAt: new Date()
        }
      ];
      
      const gamesResult = await games.insertMany(testGames);
      console.log(`✅ ${gamesResult.insertedIds.length} juegos creados`);
    }

    console.log('\n📋 Credenciales de prueba:');
    console.log('   Email: carlos@test.com | Contraseña: 123456');
    console.log('   Email: maria@test.com | Contraseña: 123456');
    console.log('   Email: juan@test.com | Contraseña: 123456');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error.message);
    process.exit(1);
  }
}

seedUsers();
