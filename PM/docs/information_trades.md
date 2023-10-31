# Create room

Começa por um pedido HTTP

### jogador -> server

```
{
	"username": nome
}
```

### server -> jogador
HTTPRequest com o html da pagina e na pagina vai o ID da sala e toda a informação unica da sala  
O server mete o primeiro como shared space (apenas o server sabe quem é o shared space)

## Join room and lobby
O CLIENTE LIGA-SE AO WEBSOCKET

# SERVIDOR -> CLIENTE
(join e leave)
```
{
	"players": {
		identificador: {
			"username": nome_do_jogador,
			"isReady": bool
		}
	}
}
```

## Character Select

### jogador -> server

Informação trocada apenas quando se dá lock in ao personagem
```
{
	"players": {
		indentificador: numero_do_personagem
	}
}
```

### server -> jogadores

```
 {
     "players": {
         indentificador: numero_do_personagem
     }
 }
 ```


Quando for recebido um dicionário com 4 players avança-se para a proxima fase
(porque toda a gente ja deu lock in)

## In game movement / actions

### jogador -> server

```
{
	"players": {
		identificador: {
			"movementKeys": {
				"left": false,
				"right": false,
				"up": false,
				"down": true,
			},
			"isInteracting": true
		}
	}
}
```


### server -> shared space

```
{
	"players": {
		identificador: {
			"position": (123, 450),
		}
	}
}
```

### server -> para players

```
{
	"players": {
		identificador: {
			"items": [item1, item2],
			canInteract: false
		}
	}
}
```

