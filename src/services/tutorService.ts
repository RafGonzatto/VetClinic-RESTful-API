import { getRepository } from 'typeorm'
import { Tutor } from '../models/tutorModel'
import { TutorRepository } from '../repositories/tutorRepository'
import { Paciente } from '../models/pacienteModel'

export class TutorService {
  static async listarTutores() {
    const tutorRepository = getRepository(Tutor)
    return await tutorRepository.find()
  }
  static async listarTutoresPacientes() {
    const tutorRepository = getRepository(Tutor)
    const tutores = await tutorRepository.find({ relations: ['pacientes'] })

    const tutoresComPacientes = tutores.map((tutor) => {
      let pacientes: {
        id: number | undefined
        nome: string | undefined
        especie: string | undefined
        dataNascimento: string | undefined
      }[] = []
      if (tutor.pacientes) {
        pacientes = tutor.pacientes.map((paciente) => {
          return {
            id: paciente.id,
            nome: paciente.nome,
            especie: paciente.especie,
            dataNascimento: paciente.dataNascimento,
          }
        })
      }
      return {
        tutor: {
          id: tutor.id,
          nome: tutor.nome,
          email: tutor.email,
          telefone: tutor.telefone,
        },
        pacientes,
      }
    })

    return tutoresComPacientes
  }

  static async criarTutor(
    nome: string,
    email: string,
    telefone: string,
  ): Promise<Tutor> {
    if (!nome || !email || !telefone) {
      const error: CustomError = new Error(
        'Nome, email e telefone são obrigatórios',
      )
      error.status = 400
      throw error
    }
    const tutorExistente = await TutorRepository.buscarTutorPorEmail(email)
    if (tutorExistente) {
      const error: CustomError = new Error('Este email já foi cadastrado')
      error.status = 409
      throw error
    }
    return await TutorRepository.criarTutor(nome, email, telefone)
  }
  static async atualizarTutor(
    id: number,
    nome: string,
    email: string,
    telefone: string,
  ): Promise<Tutor> {
    const tutorExistente = await TutorRepository.buscarTutorPorId(id)

    if (!tutorExistente) {
      const error: CustomError = new Error('Tutor não encontrado')
      error.status = 404
      throw error
    }

    if (!nome || !email || !telefone) {
      const error: CustomError = new Error(
        'Nome, email e telefone são obrigatórios',
      )
      error.status = 400
      throw error
    }

    tutorExistente.nome = nome
    tutorExistente.email = email
    tutorExistente.telefone = telefone

    const tutorAtualizado = await TutorRepository.atualizarTutor(tutorExistente)

    return tutorAtualizado
  }
  static async deletarTutor(id: number): Promise<void> {
    const tutorRepository = getRepository(Tutor)
    const pacienteRepository = getRepository(Paciente)
    const tutorExistente = await tutorRepository.findOne({
      where: { id },
      relations: ['pacientes'],
    })

    if (!tutorExistente) {
      const error: CustomError = new Error('Tutor não encontrado')
      error.status = 404
      throw error
    }

    if (tutorExistente.pacientes && tutorExistente.pacientes.length > 0) {
      await pacienteRepository.remove(tutorExistente.pacientes)
    }

    await tutorRepository.remove(tutorExistente)
  }
}
