/**@desc  default not found response on http server */
export default ({ req, res }) => {
  res.status(404).send({
    StatusCode: 4,
    Status: false,
    StatusMessage: '404 - Not found.'
  })
};
