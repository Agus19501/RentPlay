import 'dotenv/config';
import { getDb } from '../src/config/db.js';
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
          image: 'https://picsum.photos/seed/elden-ring/1200/675',
          platform: 'PlayStation 5',
          price: 15,
          uploadedBy: result.insertedIds[0],
          available: true,
          createdAt: new Date()
        },
        {
          title: 'The Legend of Zelda: Tears of the Kingdom',
          image: 'https://picsum.photos/seed/zelda-totk/1200/675',
          platform: 'Nintendo Switch',
          price: 12,
          uploadedBy: result.insertedIds[0],
          available: true,
          createdAt: new Date()
        },
        {
          title: 'Cyberpunk 2077',
          image: 'https://picsum.photos/seed/cyberpunk-2077/1200/675',
          platform: 'Xbox Series X',
          price: 20,
          uploadedBy: result.insertedIds[1],
          available: true,
          createdAt: new Date()
        },
        {
          title: 'Spider-Man 2',
          image: 'https://picsum.photos/seed/spider-man-2/1200/675',
          platform: 'PlayStation 5',
          price: 18,
          uploadedBy: result.insertedIds[1],
          available: false,
          createdAt: new Date()
        },
        {
          title: 'Starfield',
          image: 'https://picsum.photos/seed/starfield/1200/675',
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
