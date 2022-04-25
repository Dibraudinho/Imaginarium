import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const app = admin.initializeApp();
const db = app.firestore();
const ticket = db.collection("ticket");

interface CallableResponse{
  status: string,
  message: string,
  payload: JSON,
}

interface Ticket{
  placa: string,
  horaEntrada: Date,
  horaSaida: Date,
  tipoVeiculo: string
}

/**
*Função que faz a validação do veículo
*@param {Ticket} t
*dados do veículo no firestore database
*@return {number}
*Retorna 0 caso não tenha o veículo
*1 caso o veículo esteja inválido
*2 caso o veículo esteja válido
*/
function errorCode(t: Ticket): number {
  if (t.placa == null) {
    return 3;
  }
  if (t.tipoVeiculo == null) {
    return 4;
  }
  return 5;
}

/**
 * Função que determina a mensagem a ser enviada
 * @param {number} valid
 * Resultado da função isValid
 * @return {string}
 * Retorna a mensagem de acordo com o resultado da função isValid
*/
function errorMessage(valid: number): string {
  let message = "";

  switch (valid) {
    case 0: {
      message = "Veículo não encontrado";
      break;
    }
    case 1: {
      message = "Veículo inválido";
      break;
    }
    case 2: {
      message = "Veículo encontrado";
      break;
    }
    case 3: {
      message = "Placa inválida";
      break;
    }
    case 4: {
      message = "Tipo do veículo inválido";
      break;
    }
  }
  return message;
}

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript

export const addTicket = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
      let result : CallableResponse;
      const hour: FirebaseFirestore.Timestamp =
      admin.firestore.Timestamp.now();
      const saida: number = hour.toDate().getHours() + data.estadia;

      const t: Ticket = {
        placa: data.placa,
        horaEntrada: hour.toDate(),
        horaSaida: hour.toDate(),
        tipoVeiculo: data.tipoVeiculo,
      };
      t.horaSaida.setHours(saida);

      const errorcode = errorCode(t);
      const errormessage = errorMessage(errorcode);

      if (errorcode == 3 || errorcode == 4) {
        result = {
          status: "ERROR",
          message: errormessage,
          payload: JSON.parse(JSON.stringify({placa: null})),
        };
      } else {
        await ticket.add(t);
        result = {
          status: "SUCCESS",
          message: "Veículo inserido com sucesso",
          payload: JSON.parse(JSON.stringify({placa: t.placa})),
        };
      }

      return result;
    });

/* export const searchTicket = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
      const snapshot = await ticket.where("placa", "==", data.placa).get();
      const search : FirebaseFirestore.DocumentData = [];

      snapshot.forEach((doc) => {
        search.push(doc.data());
      });

      const valid = isValid(search);

      const message = validResult(valid);

      let result!: CallableResponse;

      switch (valid) {
        case 0: {
          result = {
            status: "ERROR",
            message: message,
            payload: JSON.parse(JSON.stringify({docId: null})),
          };
          break;
        }
        case 1: {
          result = {
            status: "ERROR",
            message: message,
            payload: JSON.parse(JSON.stringify({docId: null})),
          };
          break;
        }
        case 2: {
          result = {
            status: "SUCCESS",
            message: message,
            payload: JSON.parse(JSON.stringify({docId: search})),
          };
          break;
        }
      }
      return result;
    }); */
