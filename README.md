# Controle_de_bombas_sever
Servidor em Node.js responsável por comunicar com um dispositivo IoT para ligar e desligar uma bomba de caixa d'água. 

Esse server em node, simula uma conexão websocket em JSON, já que o dispositivo utilizado como paramentro para o código é um ESP32.

O código também registra os comandos e o timestemp desses comandos em um banco de dados MySQL.
