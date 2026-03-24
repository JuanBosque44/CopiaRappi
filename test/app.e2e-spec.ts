import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let validToken: string;
  let validUserId: number;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should register a new user', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Test User',
        email: 'test@caca.com',
        password: 'password123'
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe('Test User');
        expect(res.body.email).toBe('test@caca.com');
      });
  });

  it('should not register a user with existing email', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Test User',
        email: 'test@caca.com',
        password: 'password123'
      })
      .expect(500)
      .expect((res) => {
        expect(res.body.message).toBe('Error al crear el usuario. Por favor, inténtalo de nuevo más tarde.');
      });
  });

  it('should login a user', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@caca.com',
        password: 'password123'
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('access_token');

        validToken = res.body.access_token;
        validUserId = Number(res.body.user.id);
        
        if (!validToken) {
          throw new Error('No se obtuvo token en el login');
        }
        if (!validUserId) {
          throw new Error('No se obtuvo userId en el login');
        }
        console.log('✓ Token obtenido correctamente:', validToken.substring(0, 20) + '...');
        console.log('✓ User ID:', validUserId);
      });
  });

  it('should not login with wrong password', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@caca.com',
        password: 'wrongpassword'
      })
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toBe('Credenciales inválidas');
      });
  });

  it('should not login with non-existing email', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'nonexistent@caca.com',
        password: 'password123'
      })
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toBe('Credenciales inválidas');
      });
  });

  describe('Rutas Protegidas', () => {
    it('should NOT access protected route without token', () => {
      return request(app.getHttpServer())
        .get('/user')
        .expect(401)
        .expect((res) => {
          console.log('✓ Error sin token (esperado):', res.body.message);
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should NOT access protected route with invalid token', () => {
      return request(app.getHttpServer())
        .get('/user')
        .set('Authorization', 'Bearer invalid_token_here')
        .expect(401)
        .expect((res) => {
          console.log('✓ Error con token inválido (esperado):', res.body.message);
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should access protected route with valid token', () => {

      
      if (!validToken) {
        throw new Error('❌ No hay token disponible. Asegúrate de ejecutar "should login a user" primero');
      }

      console.log(' Usando token:', validToken.substring(0, 20) + '...');
      
      return request(app.getHttpServer())
        .get(`/user/${validUserId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200)
        .expect((res) => {
          console.log('✓ User profile obtenido:', res.body);
          expect(res.body).toHaveProperty('id');
          expect(res.body.id).toBe(validUserId);
          expect(res.body.name).toBe('Test User');
          expect(res.body.email).toBe('test@caca.com');
        })
        .catch((err) => {
          console.error('❌ Error al acceder con token válido: ' + err.message + ' usuarioId: ' + validUserId);
          throw err;
        });
    });

    it('should get user profile with valid token', () => {
      if (!validToken) {
        throw new Error('❌ No hay token disponible');
      }

      if (!validUserId) {
        throw new Error('❌ No hay userId disponible');
      }

      return request(app.getHttpServer())
        .get(`/user/${validUserId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200)
        .expect((res) => {
          console.log('✓ Profile obtenido:', res.body);
          expect(res.body).toHaveProperty('email');
        })
        .catch((err) => {
          console.error('❌ Error obteniendo profile: ' + err.message + ' usuarioId: ' + validUserId);
          throw err;
        });
    });

    it('should reject malformed authorization header', () => {
      return request(app.getHttpServer())
        .get('/user')
        .set('Authorization', 'InvalidFormat')
        .expect(401)
        .expect((res) => {
          console.log('✓ Token malformado rechazado:', res.body.message);
        });
    });
  });

  describe('Manejo de errores', () => {
    it('should return 404 for non-existing route', () => {
      return request(app.getHttpServer())
        .get('/non-existing-route')
        .expect(404)
        .expect((res) => {
          console.log('✓ Ruta no encontrada (esperado):', res.body.message);
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should return 500 for server error', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(500)
        .expect((res) => {
          console.log('✓ Error de servidor (esperado):', res.body.message);
        });
      });

      it('should return validation error for invalid input', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({
            name: 'Test User',
            email: 'invalid-email',
            password: 'password123'
          })
          .expect(500)
          .expect((res) => {
            console.log('✓ Error de validación (esperado):', res.body.message);
            expect(res.body).toHaveProperty('message');
          });
        });
    });

});
