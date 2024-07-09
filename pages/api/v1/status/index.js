function status(request, response) {
  response.status(200).json({ chave: "OK!" });
}

export default status;
