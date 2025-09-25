--
-- PostgreSQL database dump
--

\restrict E1weld6Yp0cqxILYgBbZFlq71Qqd1PRzyWyOG2447gmnDRCwlgLUTZ2sljgZjMw

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

-- Started on 2025-09-25 13:01:01

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5 (class 2615 OID 22021)
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- TOC entry 5257 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- TOC entry 912 (class 1247 OID 22078)
-- Name: AccountStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AccountStatus" AS ENUM (
    'active',
    'inactive',
    'suspended'
);


ALTER TYPE public."AccountStatus" OWNER TO postgres;

--
-- TOC entry 903 (class 1247 OID 22046)
-- Name: BetType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BetType" AS ENUM (
    'standard',
    'rambolito'
);


ALTER TYPE public."BetType" OWNER TO postgres;

--
-- TOC entry 906 (class 1247 OID 22062)
-- Name: DrawStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DrawStatus" AS ENUM (
    'open',
    'closed',
    'settled'
);


ALTER TYPE public."DrawStatus" OWNER TO postgres;

--
-- TOC entry 909 (class 1247 OID 22070)
-- Name: DrawTime; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DrawTime" AS ENUM (
    'twoPM',
    'fivePM',
    'ninePM'
);


ALTER TYPE public."DrawTime" OWNER TO postgres;

--
-- TOC entry 975 (class 1247 OID 22484)
-- Name: TicketStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TicketStatus" AS ENUM (
    'pending',
    'validated',
    'paid',
    'cancelled'
);


ALTER TYPE public."TicketStatus" OWNER TO postgres;

--
-- TOC entry 900 (class 1247 OID 22032)
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'superadmin',
    'admin',
    'area_coordinator',
    'coordinator',
    'agent',
    'operator'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 215 (class 1259 OID 22022)
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 22227)
-- Name: agent_ticket_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_ticket_templates (
    id integer NOT NULL,
    agent_id integer NOT NULL,
    template_id integer NOT NULL,
    assigned_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.agent_ticket_templates OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 22226)
-- Name: agent_ticket_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.agent_ticket_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.agent_ticket_templates_id_seq OWNER TO postgres;

--
-- TOC entry 5259 (class 0 OID 0)
-- Dependencies: 244
-- Name: agent_ticket_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.agent_ticket_templates_id_seq OWNED BY public.agent_ticket_templates.id;


--
-- TOC entry 270 (class 1259 OID 23742)
-- Name: audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_log (
    id integer NOT NULL,
    user_id integer,
    table_name text NOT NULL,
    record_id text,
    details jsonb,
    ip_address text NOT NULL,
    user_agent text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    operation character varying(20) DEFAULT 'UPDATE'::character varying,
    new_values jsonb,
    old_values jsonb,
    action character varying(20) DEFAULT 'INSERT'::character varying NOT NULL,
    CONSTRAINT audit_log_action_check CHECK (((action)::text = ANY ((ARRAY['INSERT'::character varying, 'UPDATE'::character varying, 'DELETE'::character varying])::text[]))),
    CONSTRAINT audit_log_operation_check CHECK (((operation)::text = ANY ((ARRAY['INSERT'::character varying, 'UPDATE'::character varying, 'DELETE'::character varying])::text[])))
);


ALTER TABLE public.audit_log OWNER TO postgres;

--
-- TOC entry 269 (class 1259 OID 23741)
-- Name: audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_log_id_seq OWNER TO postgres;

--
-- TOC entry 5260 (class 0 OID 0)
-- Dependencies: 269
-- Name: audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_log_id_seq OWNED BY public.audit_log.id;


--
-- TOC entry 223 (class 1259 OID 22117)
-- Name: balance_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.balance_transactions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    amount double precision NOT NULL,
    transaction_type text NOT NULL,
    description text,
    reference_id text,
    processed_by integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status character varying(20) DEFAULT 'completed'::character varying
);


ALTER TABLE public.balance_transactions OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 22116)
-- Name: balance_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.balance_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.balance_transactions_id_seq OWNER TO postgres;

--
-- TOC entry 5261 (class 0 OID 0)
-- Dependencies: 222
-- Name: balance_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.balance_transactions_id_seq OWNED BY public.balance_transactions.id;


--
-- TOC entry 237 (class 1259 OID 22187)
-- Name: bet_limits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bet_limits (
    id integer NOT NULL,
    bet_type public."BetType" NOT NULL,
    limit_amount double precision NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.bet_limits OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 22186)
-- Name: bet_limits_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bet_limits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bet_limits_id_seq OWNER TO postgres;

--
-- TOC entry 5262 (class 0 OID 0)
-- Dependencies: 236
-- Name: bet_limits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bet_limits_id_seq OWNED BY public.bet_limits.id;


--
-- TOC entry 249 (class 1259 OID 22246)
-- Name: bet_limits_per_draw; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bet_limits_per_draw (
    id integer NOT NULL,
    draw_id integer NOT NULL,
    bet_combination text NOT NULL,
    bet_type public."BetType" NOT NULL,
    current_amount double precision DEFAULT 0.00 NOT NULL,
    limit_amount double precision NOT NULL,
    is_sold_out boolean DEFAULT false NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.bet_limits_per_draw OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 22245)
-- Name: bet_limits_per_draw_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bet_limits_per_draw_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bet_limits_per_draw_id_seq OWNER TO postgres;

--
-- TOC entry 5263 (class 0 OID 0)
-- Dependencies: 248
-- Name: bet_limits_per_draw_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bet_limits_per_draw_id_seq OWNED BY public.bet_limits_per_draw.id;


--
-- TOC entry 261 (class 1259 OID 23662)
-- Name: bets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bets (
    id integer NOT NULL,
    ticket_id integer NOT NULL,
    bet_type public."BetType" NOT NULL,
    bet_combination text NOT NULL,
    bet_amount double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.bets OWNER TO postgres;

--
-- TOC entry 260 (class 1259 OID 23661)
-- Name: bets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bets_id_seq OWNER TO postgres;

--
-- TOC entry 5264 (class 0 OID 0)
-- Dependencies: 260
-- Name: bets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bets_id_seq OWNED BY public.bets.id;


--
-- TOC entry 231 (class 1259 OID 22159)
-- Name: commissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.commissions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    draw_id integer NOT NULL,
    commission_rate double precision NOT NULL,
    commission_amount double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.commissions OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 22158)
-- Name: commissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.commissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.commissions_id_seq OWNER TO postgres;

--
-- TOC entry 5265 (class 0 OID 0)
-- Dependencies: 230
-- Name: commissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.commissions_id_seq OWNED BY public.commissions.id;


--
-- TOC entry 239 (class 1259 OID 22196)
-- Name: current_bet_totals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.current_bet_totals (
    id integer NOT NULL,
    draw_id integer NOT NULL,
    bet_combination text NOT NULL,
    bet_type public."BetType" NOT NULL,
    total_amount double precision DEFAULT 0.00 NOT NULL,
    ticket_count integer DEFAULT 0 NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.current_bet_totals OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 22195)
-- Name: current_bet_totals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.current_bet_totals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.current_bet_totals_id_seq OWNER TO postgres;

--
-- TOC entry 5266 (class 0 OID 0)
-- Dependencies: 238
-- Name: current_bet_totals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.current_bet_totals_id_seq OWNED BY public.current_bet_totals.id;


--
-- TOC entry 247 (class 1259 OID 22235)
-- Name: draw_results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.draw_results (
    id integer NOT NULL,
    draw_id integer NOT NULL,
    winning_number text NOT NULL,
    input_by integer NOT NULL,
    input_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_official boolean DEFAULT true NOT NULL
);


ALTER TABLE public.draw_results OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 22234)
-- Name: draw_results_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.draw_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.draw_results_id_seq OWNER TO postgres;

--
-- TOC entry 5267 (class 0 OID 0)
-- Dependencies: 246
-- Name: draw_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.draw_results_id_seq OWNED BY public.draw_results.id;


--
-- TOC entry 225 (class 1259 OID 22127)
-- Name: draws; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.draws (
    id integer NOT NULL,
    draw_date timestamp(3) without time zone NOT NULL,
    draw_time public."DrawTime" NOT NULL,
    winning_number text,
    status public."DrawStatus" DEFAULT 'open'::public."DrawStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    cutoff_time timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.draws OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 22126)
-- Name: draws_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.draws_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.draws_id_seq OWNER TO postgres;

--
-- TOC entry 5268 (class 0 OID 0)
-- Dependencies: 224
-- Name: draws_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.draws_id_seq OWNED BY public.draws.id;


--
-- TOC entry 263 (class 1259 OID 23672)
-- Name: login_audit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.login_audit (
    id integer NOT NULL,
    user_id integer NOT NULL,
    username text NOT NULL,
    ip_address text NOT NULL,
    user_agent text NOT NULL,
    reason text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status text DEFAULT 'failed'::text NOT NULL
);


ALTER TABLE public.login_audit OWNER TO postgres;

--
-- TOC entry 262 (class 1259 OID 23671)
-- Name: login_audit_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.login_audit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.login_audit_id_seq OWNER TO postgres;

--
-- TOC entry 5269 (class 0 OID 0)
-- Dependencies: 262
-- Name: login_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.login_audit_id_seq OWNED BY public.login_audit.id;


--
-- TOC entry 235 (class 1259 OID 22176)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    related_ticket_id integer,
    related_draw_id integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 22175)
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- TOC entry 5270 (class 0 OID 0)
-- Dependencies: 234
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- TOC entry 259 (class 1259 OID 22552)
-- Name: prize_configurations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prize_configurations (
    id integer NOT NULL,
    bet_type public."BetType" NOT NULL,
    multiplier double precision DEFAULT 450.0 NOT NULL,
    base_amount double precision DEFAULT 10.0 NOT NULL,
    base_prize double precision DEFAULT 4500.0 NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by_id integer NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    updated_by_id integer
);


ALTER TABLE public.prize_configurations OWNER TO postgres;

--
-- TOC entry 258 (class 1259 OID 22551)
-- Name: prize_configurations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.prize_configurations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prize_configurations_id_seq OWNER TO postgres;

--
-- TOC entry 5271 (class 0 OID 0)
-- Dependencies: 258
-- Name: prize_configurations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.prize_configurations_id_seq OWNED BY public.prize_configurations.id;


--
-- TOC entry 268 (class 1259 OID 23701)
-- Name: rate_limits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rate_limits (
    key character varying(255) NOT NULL,
    count integer DEFAULT 1,
    expires_at timestamp(6) without time zone NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.rate_limits OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 22086)
-- Name: regions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.regions (
    id integer NOT NULL,
    name text NOT NULL,
    "areaCoordinatorId" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.regions OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 22085)
-- Name: regions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.regions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.regions_id_seq OWNER TO postgres;

--
-- TOC entry 5272 (class 0 OID 0)
-- Dependencies: 216
-- Name: regions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.regions_id_seq OWNED BY public.regions.id;


--
-- TOC entry 255 (class 1259 OID 22447)
-- Name: role_function_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_function_permissions (
    id integer NOT NULL,
    role text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    function_id integer NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL
);


ALTER TABLE public.role_function_permissions OWNER TO postgres;

--
-- TOC entry 254 (class 1259 OID 22446)
-- Name: role_function_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.role_function_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.role_function_permissions_id_seq OWNER TO postgres;

--
-- TOC entry 5273 (class 0 OID 0)
-- Dependencies: 254
-- Name: role_function_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.role_function_permissions_id_seq OWNED BY public.role_function_permissions.id;


--
-- TOC entry 229 (class 1259 OID 22151)
-- Name: sales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales (
    id integer NOT NULL,
    user_id integer NOT NULL,
    draw_id integer NOT NULL,
    bet_type public."BetType" NOT NULL,
    total_amount double precision NOT NULL,
    ticket_count integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.sales OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 22150)
-- Name: sales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_id_seq OWNER TO postgres;

--
-- TOC entry 5274 (class 0 OID 0)
-- Dependencies: 228
-- Name: sales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sales_id_seq OWNED BY public.sales.id;


--
-- TOC entry 267 (class 1259 OID 23692)
-- Name: security_audit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.security_audit (
    id integer NOT NULL,
    user_id integer,
    ip_address text NOT NULL,
    user_agent text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    description text,
    event_type text NOT NULL
);


ALTER TABLE public.security_audit OWNER TO postgres;

--
-- TOC entry 266 (class 1259 OID 23691)
-- Name: security_audit_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.security_audit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.security_audit_id_seq OWNER TO postgres;

--
-- TOC entry 5275 (class 0 OID 0)
-- Dependencies: 266
-- Name: security_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.security_audit_id_seq OWNED BY public.security_audit.id;


--
-- TOC entry 253 (class 1259 OID 22436)
-- Name: system_functions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_functions (
    id integer NOT NULL,
    name text NOT NULL,
    key text NOT NULL,
    description text,
    category text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.system_functions OWNER TO postgres;

--
-- TOC entry 252 (class 1259 OID 22435)
-- Name: system_functions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_functions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_functions_id_seq OWNER TO postgres;

--
-- TOC entry 5276 (class 0 OID 0)
-- Dependencies: 252
-- Name: system_functions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_functions_id_seq OWNED BY public.system_functions.id;


--
-- TOC entry 265 (class 1259 OID 23682)
-- Name: system_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_logs (
    id integer NOT NULL,
    user_id integer,
    action text NOT NULL,
    category text NOT NULL,
    details text,
    ip_address text NOT NULL,
    user_agent text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.system_logs OWNER TO postgres;

--
-- TOC entry 264 (class 1259 OID 23681)
-- Name: system_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_logs_id_seq OWNER TO postgres;

--
-- TOC entry 5277 (class 0 OID 0)
-- Dependencies: 264
-- Name: system_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_logs_id_seq OWNED BY public.system_logs.id;


--
-- TOC entry 241 (class 1259 OID 22207)
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    id integer NOT NULL,
    setting_key text NOT NULL,
    setting_value text NOT NULL,
    description text,
    updated_by integer,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 22206)
-- Name: system_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_settings_id_seq OWNER TO postgres;

--
-- TOC entry 5278 (class 0 OID 0)
-- Dependencies: 240
-- Name: system_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_settings_id_seq OWNED BY public.system_settings.id;


--
-- TOC entry 257 (class 1259 OID 22520)
-- Name: ticket_reprints; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_reprints (
    id integer NOT NULL,
    ticket_id integer NOT NULL,
    reprinted_by_id integer NOT NULL,
    reprint_number integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.ticket_reprints OWNER TO postgres;

--
-- TOC entry 256 (class 1259 OID 22519)
-- Name: ticket_reprints_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_reprints_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_reprints_id_seq OWNER TO postgres;

--
-- TOC entry 5279 (class 0 OID 0)
-- Dependencies: 256
-- Name: ticket_reprints_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_reprints_id_seq OWNED BY public.ticket_reprints.id;


--
-- TOC entry 243 (class 1259 OID 22216)
-- Name: ticket_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_templates (
    id integer NOT NULL,
    name text NOT NULL,
    design jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.ticket_templates OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 22215)
-- Name: ticket_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_templates_id_seq OWNER TO postgres;

--
-- TOC entry 5280 (class 0 OID 0)
-- Dependencies: 242
-- Name: ticket_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_templates_id_seq OWNED BY public.ticket_templates.id;


--
-- TOC entry 227 (class 1259 OID 22138)
-- Name: tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tickets (
    id integer NOT NULL,
    ticket_number text NOT NULL,
    user_id integer NOT NULL,
    draw_id integer NOT NULL,
    total_amount double precision NOT NULL,
    status public."TicketStatus" DEFAULT 'pending'::public."TicketStatus" NOT NULL,
    qr_code text NOT NULL,
    template_id integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    agent_id integer NOT NULL,
    bet_date timestamp(3) without time zone NOT NULL,
    reprint_count integer DEFAULT 0 NOT NULL,
    sequence_number text NOT NULL
);


ALTER TABLE public.tickets OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 22137)
-- Name: tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tickets_id_seq OWNER TO postgres;

--
-- TOC entry 5281 (class 0 OID 0)
-- Dependencies: 226
-- Name: tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tickets_id_seq OWNED BY public.tickets.id;


--
-- TOC entry 221 (class 1259 OID 22107)
-- Name: user_balances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_balances (
    id integer NOT NULL,
    user_id integer NOT NULL,
    current_balance double precision DEFAULT 0.00 NOT NULL,
    last_updated timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_balances OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 22106)
-- Name: user_balances_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_balances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_balances_id_seq OWNER TO postgres;

--
-- TOC entry 5282 (class 0 OID 0)
-- Dependencies: 220
-- Name: user_balances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_balances_id_seq OWNED BY public.user_balances.id;


--
-- TOC entry 272 (class 1259 OID 23759)
-- Name: user_bet_limits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_bet_limits (
    id integer NOT NULL,
    user_id integer NOT NULL,
    draw_id integer NOT NULL,
    bet_type character varying(20) NOT NULL,
    max_amount numeric(12,2) DEFAULT 1000.00,
    current_amount numeric(12,2) DEFAULT 0.00,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_bet_limits OWNER TO postgres;

--
-- TOC entry 271 (class 1259 OID 23758)
-- Name: user_bet_limits_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_bet_limits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_bet_limits_id_seq OWNER TO postgres;

--
-- TOC entry 5283 (class 0 OID 0)
-- Dependencies: 271
-- Name: user_bet_limits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_bet_limits_id_seq OWNED BY public.user_bet_limits.id;


--
-- TOC entry 219 (class 1259 OID 22096)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL,
    email text,
    full_name text NOT NULL,
    address text,
    phone text,
    region_id integer,
    coordinator_id integer,
    created_by integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    agent_id text,
    role text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 22095)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5284 (class 0 OID 0)
-- Dependencies: 218
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 251 (class 1259 OID 22257)
-- Name: winning_prizes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.winning_prizes (
    id integer NOT NULL,
    bet_type public."BetType" NOT NULL,
    prize_amount double precision NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.winning_prizes OWNER TO postgres;

--
-- TOC entry 250 (class 1259 OID 22256)
-- Name: winning_prizes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.winning_prizes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.winning_prizes_id_seq OWNER TO postgres;

--
-- TOC entry 5285 (class 0 OID 0)
-- Dependencies: 250
-- Name: winning_prizes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.winning_prizes_id_seq OWNED BY public.winning_prizes.id;


--
-- TOC entry 233 (class 1259 OID 22167)
-- Name: winning_tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.winning_tickets (
    id integer NOT NULL,
    ticket_id integer NOT NULL,
    draw_id integer NOT NULL,
    prize_amount double precision NOT NULL,
    is_claimed boolean DEFAULT false NOT NULL,
    claimed_at timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.winning_tickets OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 22166)
-- Name: winning_tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.winning_tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.winning_tickets_id_seq OWNER TO postgres;

--
-- TOC entry 5286 (class 0 OID 0)
-- Dependencies: 232
-- Name: winning_tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.winning_tickets_id_seq OWNED BY public.winning_tickets.id;


--
-- TOC entry 4938 (class 2604 OID 22230)
-- Name: agent_ticket_templates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_ticket_templates ALTER COLUMN id SET DEFAULT nextval('public.agent_ticket_templates_id_seq'::regclass);


--
-- TOC entry 4974 (class 2604 OID 23745)
-- Name: audit_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log ALTER COLUMN id SET DEFAULT nextval('public.audit_log_id_seq'::regclass);


--
-- TOC entry 4907 (class 2604 OID 22120)
-- Name: balance_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balance_transactions ALTER COLUMN id SET DEFAULT nextval('public.balance_transactions_id_seq'::regclass);


--
-- TOC entry 4928 (class 2604 OID 22190)
-- Name: bet_limits id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bet_limits ALTER COLUMN id SET DEFAULT nextval('public.bet_limits_id_seq'::regclass);


--
-- TOC entry 4943 (class 2604 OID 22249)
-- Name: bet_limits_per_draw id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bet_limits_per_draw ALTER COLUMN id SET DEFAULT nextval('public.bet_limits_per_draw_id_seq'::regclass);


--
-- TOC entry 4963 (class 2604 OID 23665)
-- Name: bets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bets ALTER COLUMN id SET DEFAULT nextval('public.bets_id_seq'::regclass);


--
-- TOC entry 4920 (class 2604 OID 22162)
-- Name: commissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commissions ALTER COLUMN id SET DEFAULT nextval('public.commissions_id_seq'::regclass);


--
-- TOC entry 4931 (class 2604 OID 22199)
-- Name: current_bet_totals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.current_bet_totals ALTER COLUMN id SET DEFAULT nextval('public.current_bet_totals_id_seq'::regclass);


--
-- TOC entry 4940 (class 2604 OID 22238)
-- Name: draw_results id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_results ALTER COLUMN id SET DEFAULT nextval('public.draw_results_id_seq'::regclass);


--
-- TOC entry 4910 (class 2604 OID 22130)
-- Name: draws id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draws ALTER COLUMN id SET DEFAULT nextval('public.draws_id_seq'::regclass);


--
-- TOC entry 4965 (class 2604 OID 23675)
-- Name: login_audit id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_audit ALTER COLUMN id SET DEFAULT nextval('public.login_audit_id_seq'::regclass);


--
-- TOC entry 4925 (class 2604 OID 22179)
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- TOC entry 4957 (class 2604 OID 22555)
-- Name: prize_configurations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prize_configurations ALTER COLUMN id SET DEFAULT nextval('public.prize_configurations_id_seq'::regclass);


--
-- TOC entry 4898 (class 2604 OID 22089)
-- Name: regions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.regions ALTER COLUMN id SET DEFAULT nextval('public.regions_id_seq'::regclass);


--
-- TOC entry 4952 (class 2604 OID 22450)
-- Name: role_function_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_function_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_function_permissions_id_seq'::regclass);


--
-- TOC entry 4918 (class 2604 OID 22154)
-- Name: sales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales ALTER COLUMN id SET DEFAULT nextval('public.sales_id_seq'::regclass);


--
-- TOC entry 4970 (class 2604 OID 23695)
-- Name: security_audit id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.security_audit ALTER COLUMN id SET DEFAULT nextval('public.security_audit_id_seq'::regclass);


--
-- TOC entry 4949 (class 2604 OID 22439)
-- Name: system_functions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_functions ALTER COLUMN id SET DEFAULT nextval('public.system_functions_id_seq'::regclass);


--
-- TOC entry 4968 (class 2604 OID 23685)
-- Name: system_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_logs ALTER COLUMN id SET DEFAULT nextval('public.system_logs_id_seq'::regclass);


--
-- TOC entry 4934 (class 2604 OID 22210)
-- Name: system_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings ALTER COLUMN id SET DEFAULT nextval('public.system_settings_id_seq'::regclass);


--
-- TOC entry 4955 (class 2604 OID 22523)
-- Name: ticket_reprints id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_reprints ALTER COLUMN id SET DEFAULT nextval('public.ticket_reprints_id_seq'::regclass);


--
-- TOC entry 4935 (class 2604 OID 22219)
-- Name: ticket_templates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_templates ALTER COLUMN id SET DEFAULT nextval('public.ticket_templates_id_seq'::regclass);


--
-- TOC entry 4913 (class 2604 OID 22141)
-- Name: tickets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets ALTER COLUMN id SET DEFAULT nextval('public.tickets_id_seq'::regclass);


--
-- TOC entry 4903 (class 2604 OID 22110)
-- Name: user_balances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_balances ALTER COLUMN id SET DEFAULT nextval('public.user_balances_id_seq'::regclass);


--
-- TOC entry 4978 (class 2604 OID 23762)
-- Name: user_bet_limits id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_bet_limits ALTER COLUMN id SET DEFAULT nextval('public.user_bet_limits_id_seq'::regclass);


--
-- TOC entry 4900 (class 2604 OID 22099)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4946 (class 2604 OID 22260)
-- Name: winning_prizes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.winning_prizes ALTER COLUMN id SET DEFAULT nextval('public.winning_prizes_id_seq'::regclass);


--
-- TOC entry 4922 (class 2604 OID 22170)
-- Name: winning_tickets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.winning_tickets ALTER COLUMN id SET DEFAULT nextval('public.winning_tickets_id_seq'::regclass);


--
-- TOC entry 4986 (class 2606 OID 22030)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 5029 (class 2606 OID 22233)
-- Name: agent_ticket_templates agent_ticket_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_ticket_templates
    ADD CONSTRAINT agent_ticket_templates_pkey PRIMARY KEY (id);


--
-- TOC entry 5063 (class 2606 OID 23750)
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- TOC entry 4999 (class 2606 OID 22125)
-- Name: balance_transactions balance_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balance_transactions
    ADD CONSTRAINT balance_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 5035 (class 2606 OID 22255)
-- Name: bet_limits_per_draw bet_limits_per_draw_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bet_limits_per_draw
    ADD CONSTRAINT bet_limits_per_draw_pkey PRIMARY KEY (id);


--
-- TOC entry 5017 (class 2606 OID 22194)
-- Name: bet_limits bet_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bet_limits
    ADD CONSTRAINT bet_limits_pkey PRIMARY KEY (id);


--
-- TOC entry 5052 (class 2606 OID 23670)
-- Name: bets bets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bets
    ADD CONSTRAINT bets_pkey PRIMARY KEY (id);


--
-- TOC entry 5010 (class 2606 OID 22165)
-- Name: commissions commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_pkey PRIMARY KEY (id);


--
-- TOC entry 5020 (class 2606 OID 22205)
-- Name: current_bet_totals current_bet_totals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.current_bet_totals
    ADD CONSTRAINT current_bet_totals_pkey PRIMARY KEY (id);


--
-- TOC entry 5032 (class 2606 OID 22244)
-- Name: draw_results draw_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_results
    ADD CONSTRAINT draw_results_pkey PRIMARY KEY (id);


--
-- TOC entry 5002 (class 2606 OID 22136)
-- Name: draws draws_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draws
    ADD CONSTRAINT draws_pkey PRIMARY KEY (id);


--
-- TOC entry 5054 (class 2606 OID 23680)
-- Name: login_audit login_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_audit
    ADD CONSTRAINT login_audit_pkey PRIMARY KEY (id);


--
-- TOC entry 5014 (class 2606 OID 22185)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 5050 (class 2606 OID 22561)
-- Name: prize_configurations prize_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prize_configurations
    ADD CONSTRAINT prize_configurations_pkey PRIMARY KEY (id);


--
-- TOC entry 5061 (class 2606 OID 23707)
-- Name: rate_limits rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rate_limits
    ADD CONSTRAINT rate_limits_pkey PRIMARY KEY (key);


--
-- TOC entry 4990 (class 2606 OID 22094)
-- Name: regions regions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_pkey PRIMARY KEY (id);


--
-- TOC entry 5044 (class 2606 OID 22456)
-- Name: role_function_permissions role_function_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_function_permissions
    ADD CONSTRAINT role_function_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 5007 (class 2606 OID 22157)
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- TOC entry 5058 (class 2606 OID 23700)
-- Name: security_audit security_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.security_audit
    ADD CONSTRAINT security_audit_pkey PRIMARY KEY (id);


--
-- TOC entry 5042 (class 2606 OID 22445)
-- Name: system_functions system_functions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_functions
    ADD CONSTRAINT system_functions_pkey PRIMARY KEY (id);


--
-- TOC entry 5056 (class 2606 OID 23690)
-- Name: system_logs system_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5022 (class 2606 OID 22214)
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 5047 (class 2606 OID 22526)
-- Name: ticket_reprints ticket_reprints_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_reprints
    ADD CONSTRAINT ticket_reprints_pkey PRIMARY KEY (id);


--
-- TOC entry 5026 (class 2606 OID 22225)
-- Name: ticket_templates ticket_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_templates
    ADD CONSTRAINT ticket_templates_pkey PRIMARY KEY (id);


--
-- TOC entry 5004 (class 2606 OID 22149)
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- TOC entry 5066 (class 2606 OID 23770)
-- Name: user_bet_limits unique_user_draw_bet_limit; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_bet_limits
    ADD CONSTRAINT unique_user_draw_bet_limit UNIQUE (user_id, draw_id, bet_type);


--
-- TOC entry 4996 (class 2606 OID 22115)
-- Name: user_balances user_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_balances
    ADD CONSTRAINT user_balances_pkey PRIMARY KEY (id);


--
-- TOC entry 5068 (class 2606 OID 23768)
-- Name: user_bet_limits user_bet_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_bet_limits
    ADD CONSTRAINT user_bet_limits_pkey PRIMARY KEY (id);


--
-- TOC entry 4993 (class 2606 OID 22105)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5038 (class 2606 OID 22264)
-- Name: winning_prizes winning_prizes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.winning_prizes
    ADD CONSTRAINT winning_prizes_pkey PRIMARY KEY (id);


--
-- TOC entry 5012 (class 2606 OID 22174)
-- Name: winning_tickets winning_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.winning_tickets
    ADD CONSTRAINT winning_tickets_pkey PRIMARY KEY (id);


--
-- TOC entry 5027 (class 1259 OID 22276)
-- Name: agent_ticket_templates_agent_id_template_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX agent_ticket_templates_agent_id_template_id_key ON public.agent_ticket_templates USING btree (agent_id, template_id);


--
-- TOC entry 5015 (class 1259 OID 22527)
-- Name: bet_limits_bet_type_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX bet_limits_bet_type_key ON public.bet_limits USING btree (bet_type);


--
-- TOC entry 5033 (class 1259 OID 22278)
-- Name: bet_limits_per_draw_draw_id_bet_combination_bet_type_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX bet_limits_per_draw_draw_id_bet_combination_bet_type_key ON public.bet_limits_per_draw USING btree (draw_id, bet_combination, bet_type);


--
-- TOC entry 5018 (class 1259 OID 22274)
-- Name: current_bet_totals_draw_id_bet_combination_bet_type_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX current_bet_totals_draw_id_bet_combination_bet_type_key ON public.current_bet_totals USING btree (draw_id, bet_combination, bet_type);


--
-- TOC entry 5030 (class 1259 OID 22277)
-- Name: draw_results_draw_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX draw_results_draw_id_key ON public.draw_results USING btree (draw_id);


--
-- TOC entry 5000 (class 1259 OID 22270)
-- Name: draws_draw_date_draw_time_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX draws_draw_date_draw_time_key ON public.draws USING btree (draw_date, draw_time);


--
-- TOC entry 5059 (class 1259 OID 23708)
-- Name: idx_rate_limits_expires; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rate_limits_expires ON public.rate_limits USING btree (expires_at);


--
-- TOC entry 5064 (class 1259 OID 23781)
-- Name: idx_user_bet_limits_user_draw; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_bet_limits_user_draw ON public.user_bet_limits USING btree (user_id, draw_id);


--
-- TOC entry 5048 (class 1259 OID 22562)
-- Name: prize_configurations_bet_type_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX prize_configurations_bet_type_key ON public.prize_configurations USING btree (bet_type);


--
-- TOC entry 4987 (class 1259 OID 22266)
-- Name: regions_areaCoordinatorId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "regions_areaCoordinatorId_key" ON public.regions USING btree ("areaCoordinatorId");


--
-- TOC entry 4988 (class 1259 OID 22265)
-- Name: regions_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX regions_name_key ON public.regions USING btree (name);


--
-- TOC entry 5045 (class 1259 OID 22528)
-- Name: role_function_permissions_role_function_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX role_function_permissions_role_function_id_key ON public.role_function_permissions USING btree (role, function_id);


--
-- TOC entry 5008 (class 1259 OID 22273)
-- Name: sales_user_id_draw_id_bet_type_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX sales_user_id_draw_id_bet_type_key ON public.sales USING btree (user_id, draw_id, bet_type);


--
-- TOC entry 5039 (class 1259 OID 22458)
-- Name: system_functions_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX system_functions_key_key ON public.system_functions USING btree (key);


--
-- TOC entry 5040 (class 1259 OID 22529)
-- Name: system_functions_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX system_functions_name_key ON public.system_functions USING btree (name);


--
-- TOC entry 5023 (class 1259 OID 22275)
-- Name: system_settings_setting_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX system_settings_setting_key_key ON public.system_settings USING btree (setting_key);


--
-- TOC entry 5024 (class 1259 OID 22530)
-- Name: ticket_templates_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ticket_templates_name_key ON public.ticket_templates USING btree (name);


--
-- TOC entry 5005 (class 1259 OID 22271)
-- Name: tickets_ticket_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tickets_ticket_number_key ON public.tickets USING btree (ticket_number);


--
-- TOC entry 4997 (class 1259 OID 22269)
-- Name: user_balances_user_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX user_balances_user_id_key ON public.user_balances USING btree (user_id);


--
-- TOC entry 4991 (class 1259 OID 22268)
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- TOC entry 4994 (class 1259 OID 22267)
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- TOC entry 5036 (class 1259 OID 22279)
-- Name: winning_prizes_bet_type_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX winning_prizes_bet_type_key ON public.winning_prizes USING btree (bet_type);


--
-- TOC entry 5092 (class 2606 OID 22390)
-- Name: agent_ticket_templates agent_ticket_templates_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_ticket_templates
    ADD CONSTRAINT agent_ticket_templates_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5093 (class 2606 OID 22395)
-- Name: agent_ticket_templates agent_ticket_templates_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_ticket_templates
    ADD CONSTRAINT agent_ticket_templates_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.ticket_templates(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5106 (class 2606 OID 23751)
-- Name: audit_log audit_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5074 (class 2606 OID 22310)
-- Name: balance_transactions balance_transactions_processed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balance_transactions
    ADD CONSTRAINT balance_transactions_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5075 (class 2606 OID 22305)
-- Name: balance_transactions balance_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balance_transactions
    ADD CONSTRAINT balance_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5088 (class 2606 OID 22370)
-- Name: bet_limits bet_limits_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bet_limits
    ADD CONSTRAINT bet_limits_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5096 (class 2606 OID 22410)
-- Name: bet_limits_per_draw bet_limits_per_draw_draw_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bet_limits_per_draw
    ADD CONSTRAINT bet_limits_per_draw_draw_id_fkey FOREIGN KEY (draw_id) REFERENCES public.draws(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5102 (class 2606 OID 23709)
-- Name: bets bets_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bets
    ADD CONSTRAINT bets_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5081 (class 2606 OID 22340)
-- Name: commissions commissions_draw_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_draw_id_fkey FOREIGN KEY (draw_id) REFERENCES public.draws(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5082 (class 2606 OID 22335)
-- Name: commissions commissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5089 (class 2606 OID 22375)
-- Name: current_bet_totals current_bet_totals_draw_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.current_bet_totals
    ADD CONSTRAINT current_bet_totals_draw_id_fkey FOREIGN KEY (draw_id) REFERENCES public.draws(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5094 (class 2606 OID 22400)
-- Name: draw_results draw_results_draw_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_results
    ADD CONSTRAINT draw_results_draw_id_fkey FOREIGN KEY (draw_id) REFERENCES public.draws(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5095 (class 2606 OID 22405)
-- Name: draw_results draw_results_input_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.draw_results
    ADD CONSTRAINT draw_results_input_by_fkey FOREIGN KEY (input_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5107 (class 2606 OID 23776)
-- Name: user_bet_limits fk_user_bet_limit_draw; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_bet_limits
    ADD CONSTRAINT fk_user_bet_limit_draw FOREIGN KEY (draw_id) REFERENCES public.draws(id);


--
-- TOC entry 5108 (class 2606 OID 23771)
-- Name: user_bet_limits fk_user_bet_limit_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_bet_limits
    ADD CONSTRAINT fk_user_bet_limit_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5103 (class 2606 OID 23724)
-- Name: login_audit login_audit_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_audit
    ADD CONSTRAINT login_audit_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5085 (class 2606 OID 22365)
-- Name: notifications notifications_related_draw_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_related_draw_id_fkey FOREIGN KEY (related_draw_id) REFERENCES public.draws(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5086 (class 2606 OID 22360)
-- Name: notifications notifications_related_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_related_ticket_id_fkey FOREIGN KEY (related_ticket_id) REFERENCES public.tickets(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5087 (class 2606 OID 22355)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5100 (class 2606 OID 23714)
-- Name: prize_configurations prize_configurations_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prize_configurations
    ADD CONSTRAINT prize_configurations_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5101 (class 2606 OID 23719)
-- Name: prize_configurations prize_configurations_updated_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prize_configurations
    ADD CONSTRAINT prize_configurations_updated_by_id_fkey FOREIGN KEY (updated_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5069 (class 2606 OID 22280)
-- Name: regions regions_areaCoordinatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT "regions_areaCoordinatorId_fkey" FOREIGN KEY ("areaCoordinatorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5097 (class 2606 OID 22546)
-- Name: role_function_permissions role_function_permissions_function_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_function_permissions
    ADD CONSTRAINT role_function_permissions_function_id_fkey FOREIGN KEY (function_id) REFERENCES public.system_functions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5079 (class 2606 OID 22330)
-- Name: sales sales_draw_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_draw_id_fkey FOREIGN KEY (draw_id) REFERENCES public.draws(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5080 (class 2606 OID 22325)
-- Name: sales sales_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5105 (class 2606 OID 23734)
-- Name: security_audit security_audit_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.security_audit
    ADD CONSTRAINT security_audit_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5104 (class 2606 OID 23729)
-- Name: system_logs system_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5090 (class 2606 OID 22380)
-- Name: system_settings system_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5098 (class 2606 OID 22536)
-- Name: ticket_reprints ticket_reprints_reprinted_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_reprints
    ADD CONSTRAINT ticket_reprints_reprinted_by_id_fkey FOREIGN KEY (reprinted_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5099 (class 2606 OID 22541)
-- Name: ticket_reprints ticket_reprints_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_reprints
    ADD CONSTRAINT ticket_reprints_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5091 (class 2606 OID 22385)
-- Name: ticket_templates ticket_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_templates
    ADD CONSTRAINT ticket_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5076 (class 2606 OID 22531)
-- Name: tickets tickets_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5077 (class 2606 OID 22320)
-- Name: tickets tickets_draw_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_draw_id_fkey FOREIGN KEY (draw_id) REFERENCES public.draws(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5078 (class 2606 OID 22315)
-- Name: tickets tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5073 (class 2606 OID 22300)
-- Name: user_balances user_balances_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_balances
    ADD CONSTRAINT user_balances_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5070 (class 2606 OID 22290)
-- Name: users users_coordinator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_coordinator_id_fkey FOREIGN KEY (coordinator_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5071 (class 2606 OID 22295)
-- Name: users users_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5072 (class 2606 OID 22285)
-- Name: users users_region_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.regions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5083 (class 2606 OID 22350)
-- Name: winning_tickets winning_tickets_draw_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.winning_tickets
    ADD CONSTRAINT winning_tickets_draw_id_fkey FOREIGN KEY (draw_id) REFERENCES public.draws(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5084 (class 2606 OID 22345)
-- Name: winning_tickets winning_tickets_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.winning_tickets
    ADD CONSTRAINT winning_tickets_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5258 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


-- Completed on 2025-09-25 13:01:01

--
-- PostgreSQL database dump complete
--

\unrestrict E1weld6Yp0cqxILYgBbZFlq71Qqd1PRzyWyOG2447gmnDRCwlgLUTZ2sljgZjMw

