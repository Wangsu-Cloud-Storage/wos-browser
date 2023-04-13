const CRC64 = require('./');
process.title="wosbch";

CRC64.crc64File(process.argv[2], function(err, data){
  if(err) process.send({error:err});
  else process.send({data:data});
  process.exit(0)
});
