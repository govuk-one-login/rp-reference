using Microsoft.IdentityModel.Tokens;
using System.Formats.Asn1;
using System.Linq;
using System.Security.Cryptography;

namespace GovUkOneLogin.Examples.DotNetFrameworkConsoleApp
{
    internal static class SecurityKeyHelpers
    {

        public static SecurityKey ReadRsaPrivateKey(byte[] keyBytes)
        {
            //https://www.rfc-editor.org/rfc/rfc5208#section-5
            var reader = new AsnReader(keyBytes, AsnEncodingRules.BER);
            var contents = reader.ReadSequence();

            // Version
            var version = contents.ReadInteger();

            // AlgorithmIdentifier
            var sequence = contents.ReadSequence();
            var objectIdentifier = sequence.ReadObjectIdentifier();

            // PrivateKey
            var bytes = contents.ReadOctetString();
            var reader2 = new AsnReader(bytes, AsnEncodingRules.BER);
            var sequence2 = reader2.ReadSequence();

            sequence2.ReadInteger();

            var rsaParameters = new RSAParameters();
            rsaParameters.Modulus = sequence2.ReadIntegerBytes().ToArray();
            rsaParameters.Exponent = sequence2.ReadIntegerBytes().ToArray();
            rsaParameters.D = sequence2.ReadIntegerBytes().ToArray();
            rsaParameters.P = sequence2.ReadIntegerBytes().ToArray();
            rsaParameters.Q = sequence2.ReadIntegerBytes().ToArray();
            rsaParameters.DP = sequence2.ReadIntegerBytes().ToArray();
            rsaParameters.DQ = sequence2.ReadIntegerBytes().ToArray();
            rsaParameters.InverseQ = sequence2.ReadIntegerBytes().ToArray();

            return new RsaSecurityKey(rsaParameters);
        }

        public static SecurityKey ReadEcDsaNistP256PublicKey(byte[] keyBytes)
        {
            var reader = new AsnReader(keyBytes, AsnEncodingRules.BER);
            var contents = reader.ReadSequence();

            var sequence = contents.ReadSequence();
            sequence.ReadObjectIdentifier();
            sequence.ReadObjectIdentifier();

            // Public Key Bytes
            var bytes = contents.ReadBitString(out var _unused);

            var ecDsa = ECDsa.Create(new ECParameters
            {
                Curve = ECCurve.NamedCurves.nistP256,
                Q = new ECPoint
                {
                    X = bytes.Skip(1).Take(32).ToArray(),
                    Y = bytes.Skip(33).ToArray()
                }
            });

            return new ECDsaSecurityKey(ecDsa);

        }
    }
}